const {
    PerformanceCycleService,
    PerformanceNotificationService
} = require('./performanceService');
const { PerformanceNotificationRepository, PerformanceSelfRatingRepository, PerformanceManagerRatingRepository, PerformanceOverallRatingRepository } = require('../repositories/performanceRepository');
const { EmployeeJobModel } = require('../models');
const { sendEmail } = require('../utils/emailSender');
const { pool } = require('../config/database');

class PerformanceCronService {
    constructor() {
        this.isRunning = false;
        this.intervalId = null;
        this.intervalMs = 24 * 60 * 60 * 1000; // Run daily by default
    }

    /**
     * Start the cron job
     * @param {number} intervalMs - Interval in milliseconds (default: 24 hours)
     */
    start(intervalMs = this.intervalMs) {
        if (this.isRunning) {
            console.log('Performance cron job is already running');
            return;
        }

        console.log(`Starting performance cron job (interval: ${intervalMs / 1000 / 60} minutes)`);
        this.isRunning = true;
        
        // Run immediately on start
        this.run();
        
        // Then run at intervals
        this.intervalId = setInterval(() => {
            this.run();
        }, intervalMs);
    }

    /**
     * Stop the cron job
     */
    stop() {
        if (!this.isRunning) {
            console.log('Performance cron job is not running');
            return;
        }

        console.log('Stopping performance cron job');
        this.isRunning = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Run the cron job tasks
     */
    async run() {
        console.log(`[${new Date().toISOString()}] Running performance cron job...`);
        
        try {
            // Task 1: Update cycle statuses based on current date
            const statusUpdates = await PerformanceNotificationService.checkAndUpdateCycleStatuses();
            console.log(`Cycle status updates: ${JSON.stringify(statusUpdates)}`);
            
            // Task 2: Process pending notifications
            const notificationResults = await PerformanceNotificationService.processPendingNotifications();
            console.log(`Processed ${notificationResults.length} notifications`);
            
            // Task 3: Send deadline reminders (1 working day before deadline)
            await this.sendDeadlineReminders();
            
            // Task 4: Auto-close self-ratings if deadline passed
            await this.autoCloseSelfRatings();
            
             // Task 5: Auto-close manager ratings if deadline passed
             await this.autoCloseManagerRatings();
             
             // Task 6: Notify HR when manager ratings are submitted
             await this.notifyHRForReview();
             
             console.log(`[${new Date().toISOString()}] Performance cron job completed successfully`);
        } catch (error) {
            console.error(`[${new Date().toISOString()}] Performance cron job failed:`, error.message);
        }
    }

    /**
     * Calculate working days between two dates (excluding weekends)
     */
    calculateWorkingDays(startDate, endDate) {
        let count = 0;
        const current = new Date(startDate);
        const end = new Date(endDate);
        
        while (current <= end) {
            const dayOfWeek = current.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
                count++;
            }
            current.setDate(current.getDate() + 1);
        }
        
        return count;
    }

    /**
     * Send deadline reminder emails (only when 1 working day is left and task not completed)
     */
    async sendDeadlineReminders() {
        try {
            const now = new Date();
            
            // Get active cycles
            const [cycles] = await pool.query(`
                SELECT * FROM performance_cycles 
                WHERE status IN ('self_rating_open', 'manager_rating_open')
            `);
            
            for (const cycle of cycles) {
                // ==================== SELF-RATING REMINDERS ====================
                if (cycle.status === 'self_rating_open') {
                    // Calculate working days left for self-rating deadline
                    const workingDaysLeft = this.calculateWorkingDays(now, cycle.self_rating_end);
                    
                    // Only send notification when exactly 1 working day is left
                    if (workingDaysLeft === 1) {
                        // Get all employees in this cycle who haven't submitted self-ratings
                        const [employees] = await pool.query(`
                            SELECT DISTINCT 
                                g.employee_id, 
                                e.employee_code, 
                                u.email, 
                                u.username,
                                u.id as user_id
                            FROM performance_goals g
                            JOIN employees e ON g.employee_id = e.id
                            JOIN users u ON e.user_id = u.id
                            WHERE g.cycle_id = ?
                            AND NOT EXISTS (
                                SELECT 1 FROM performance_self_ratings sr
                                WHERE sr.goal_id = g.id 
                                AND sr.status = 'submitted'
                            )
                        `, [cycle.id]);
                        
                        for (const employee of employees) {
                            // Check if notification already sent for this cycle and employee
                            const existingNotif = await PerformanceNotificationRepository.findByCycleAndRecipient(
                                cycle.id, 
                                employee.user_id, 
                                'self_rating_reminder'
                            );
                            
                            // Only send if not already sent
                            if (!existingNotif) {
                                const emailSubject = `URGENT: Self-Rating Due Tomorrow - ${cycle.cycle_name}`;
                                const emailBody = `
                                    Dear ${employee.username},
                                    
                                    This is a reminder that your self-rating for ${cycle.cycle_name} is due tomorrow (1 working day left).
                                    
                                    Deadline: ${cycle.self_rating_end}
                                    Working days remaining: 1
                                    
                                    Please login to the HR portal to submit your self-ratings immediately.
                                    
                                    Note: Once you submit, the form will be sent to your manager for approval.
                                    
                                    Regards,
                                    HR Team
                                `;
                                
                                try {
                                    await sendEmail(employee.email, emailSubject, emailBody);
                                    
                                    // Log notification
                                    await PerformanceNotificationRepository.create({
                                        cycle_id: cycle.id,
                                        recipient_id: employee.user_id,
                                        sender_id: null,
                                        notification_type: 'self_rating_reminder',
                                        subject: emailSubject,
                                        message: emailBody,
                                        scheduled_for: now,
                                        created_by: 1 // System user
                                    });
                                    
                                    console.log(`Self-rating reminder sent to ${employee.email} for cycle ${cycle.cycle_name}`);
                                } catch (emailError) {
                                    console.error(`Failed to send email to ${employee.email}:`, emailError.message);
                                }
                            }
                        }
                    }
                }
                
                // ==================== MANAGER RATING REMINDERS ====================
                if (cycle.status === 'manager_rating_open') {
                    // Calculate working days left for manager-rating deadline
                    const workingDaysLeft = this.calculateWorkingDays(now, cycle.manager_rating_end);
                    
                    // Only send notification when exactly 1 working day is left
                    if (workingDaysLeft === 1) {
                        // Get all managers in this cycle who have pending ratings
                        const [managers] = await pool.query(`
                            SELECT DISTINCT 
                                g.manager_id, 
                                e.employee_code, 
                                u.email, 
                                u.username,
                                u.id as user_id
                            FROM performance_goals g
                            JOIN employees e ON g.manager_id = e.id
                            JOIN users u ON e.user_id = u.id
                            WHERE g.cycle_id = ?
                            AND EXISTS (
                                SELECT 1 FROM performance_self_ratings sr
                                WHERE sr.goal_id = g.id 
                                AND sr.status = 'submitted'
                                AND NOT EXISTS (
                                    SELECT 1 FROM performance_manager_ratings mr
                                    WHERE mr.goal_id = g.id 
                                    AND mr.status = 'submitted'
                                )
                            )
                        `, [cycle.id]);
                        
                        for (const manager of managers) {
                            // Check if notification already sent
                            const existingNotif = await PerformanceNotificationRepository.findByCycleAndRecipient(
                                cycle.id, 
                                manager.user_id, 
                                'manager_rating_reminder'
                            );
                            
                            // Only send if not already sent
                            if (!existingNotif) {
                                const emailSubject = `URGENT: Manager Rating Due Tomorrow - ${cycle.cycle_name}`;
                                const emailBody = `
                                    Dear ${manager.username},
                                    
                                    This is a reminder that your manager ratings for ${cycle.cycle_name} are due tomorrow (1 working day left).
                                    
                                    Deadline: ${cycle.manager_rating_end}
                                    Working days remaining: 1
                                    
                                    Your team members have submitted their self-ratings and are waiting for your review.
                                    
                                    Please login to the HR portal to submit your manager ratings immediately.
                                    
                                    Note: After your submission, the ratings will be sent to HR for final approval.
                                    
                                    Regards,
                                    HR Team
                                `;
                                
                                try {
                                    await sendEmail(manager.email, emailSubject, emailBody);
                                    
                                    await PerformanceNotificationRepository.create({
                                        cycle_id: cycle.id,
                                        recipient_id: manager.user_id,
                                        sender_id: null,
                                        notification_type: 'manager_rating_reminder',
                                        subject: emailSubject,
                                        message: emailBody,
                                        scheduled_for: now,
                                        created_by: 1
                                    });
                                    
                                    console.log(`Manager rating reminder sent to ${manager.email} for cycle ${cycle.cycle_name}`);
                                } catch (emailError) {
                                    console.error(`Failed to send email to ${manager.email}:`, emailError.message);
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Failed to send deadline reminders:', error.message);
        }
    }

    /**
     * Auto-close self-ratings if deadline passed
     */
    async autoCloseSelfRatings() {
        try {
            const [cycles] = await pool.query(`
                SELECT * FROM performance_cycles 
                WHERE status = 'self_rating_open' 
                AND self_rating_end < NOW()
            `);
            
            for (const cycle of cycles) {
                console.log(`Auto-closing self-ratings for cycle: ${cycle.cycle_name}`);
                await PerformanceCycleService.updateCycleStatus(cycle.id, 'self_rating_closed');
            }
        } catch (error) {
            console.error('Failed to auto-close self-ratings:', error.message);
        }
    }

    /**
     * Auto-close manager ratings if deadline passed
     */
    async autoCloseManagerRatings() {
        try {
            const [cycles] = await pool.query(`
                SELECT * FROM performance_cycles 
                WHERE status = 'manager_rating_open' 
                AND manager_rating_end < NOW()
            `);
            
            for (const cycle of cycles) {
                console.log(`Auto-closing manager ratings for cycle: ${cycle.cycle_name}`);
                await PerformanceCycleService.updateCycleStatus(cycle.id, 'manager_rating_closed');
            }
        } catch (error) {
            console.error('Failed to auto-close manager ratings:', error.message);
        }
    }

    /**
     * Notify HR when manager ratings are submitted (all team ratings done)
     */
    async notifyHRForReview() {
        try {
            // Get cycles that are pending HR review
            const [cycles] = await pool.query(`
                SELECT pc.*, 
                       COUNT(DISTINCT opr.employee_id) as total_employees,
                       COUNT(DISTINCT mr.manager_rating) as rated_employees
                FROM performance_cycles pc
                LEFT JOIN performance_goals g ON pc.id = g.cycle_id
                LEFT JOIN performance_manager_ratings mr ON g.id = mr.goal_id AND mr.status = 'submitted'
                LEFT JOIN performance_overall_ratings opr ON pc.id = opr.cycle_id AND opr.status = 'manager_submitted'
                WHERE pc.status = 'manager_rating_closed'
                GROUP BY pc.id
                HAVING total_employees = rated_employees AND total_employees > 0
            `);
            
            for (const cycle of cycles) {
                // Get HR emails (users with HR role)
                const [hrUsers] = await pool.query(`
                    SELECT DISTINCT u.email, u.username, u.id
                    FROM users u
                    JOIN user_roles ur ON u.id = ur.user_id
                    JOIN roles r ON ur.role_id = r.id
                    WHERE r.role_name IN ('hr', 'admin')
                `);
                
                for (const hr of hrUsers) {
                    // Check if notification already sent
                    const existingNotif = await PerformanceNotificationRepository.findByCycleAndRecipient(
                        cycle.id, 
                        hr.id, 
                        'hr_review_reminder'
                    );
                    
                    if (!existingNotif) {
                        const emailSubject = `HR Review Required: ${cycle.cycle_name}`;
                        const emailBody = `
                            Dear ${hr.username},
                            
                            All manager ratings for ${cycle.cycle_name} have been submitted and are ready for HR review.
                            
                            Cycle: ${cycle.cycle_name}
                            Total Employees Rated: ${cycle.total_employees}
                            
                            Please login to the HR portal to review and approve the ratings.
                            
                            Regards,
                            System
                        `;
                        
                        try {
                            await sendEmail(hr.email, emailSubject, emailBody);
                            
                            await PerformanceNotificationRepository.create({
                                cycle_id: cycle.id,
                                recipient_id: hr.id,
                                sender_id: null,
                                notification_type: 'hr_review_reminder',
                                subject: emailSubject,
                                message: emailBody,
                                scheduled_for: new Date(),
                                created_by: 1
                            });
                            
                            console.log(`HR review notification sent to ${hr.email} for cycle ${cycle.cycle_name}`);
                        } catch (emailError) {
                            console.error(`Failed to send HR notification to ${hr.email}:`, emailError.message);
                        }
                    }
                }
                
                // Update cycle status to hr_review
                await PerformanceCycleService.updateCycleStatus(cycle.id, 'hr_review');
            }
        } catch (error) {
            console.error('Failed to notify HR for review:', error.message);
        }
    }

    /**
     * Get cron job status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            intervalMs: this.intervalMs,
            nextRun: this.intervalId ? 'Scheduled' : 'Not scheduled'
        };
    }
}

module.exports = new PerformanceCronService();
