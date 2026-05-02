const express = require('express');
const router = express.Router();

const authRoutes = require('../authRoutes');
const userRoutes = require('../userRoutes');
const employeeRoutes = require('../employeeRoutes');
const onboardingRoutes = require('../onboardingRoutes');
const masterDataRoutes = require('../masterDataRoutes');
const attendanceRoutes = require('../attendanceRoutes');
const departmentRoutes = require('../departmentRoutes');
const locationRoutes = require('../locationRoutes');
const designationRoutes = require('../designationRoutes');
const educationRoutes = require('../educationRoutes');
const courseRoutes = require('../courseRoutes');
const employmentTypeRoutes = require('../employmentTypeRoutes');
const performanceRoutes = require('../performanceRoutes');
const educationCourseMapRoutes = require('../educationCourseMapRoutes');
const auditRoutes = require('../auditRoutes');
const systemRoutes = require('../systemRoutes');
const payrollRoutes = require('../payrollRoutes');
const shiftRoutes = require('../shiftRoutes');

router.use('/auth', authRoutes);

router.use('/users', userRoutes);

router.use('/employees', employeeRoutes);

router.use('/onboarding', onboardingRoutes);

router.use('/master', masterDataRoutes);

router.use('/attendance', attendanceRoutes);

router.use('/departments', departmentRoutes);

router.use('/locations', locationRoutes);

router.use('/designations', designationRoutes);

router.use('/education', educationRoutes);

router.use('/courses', courseRoutes);

router.use('/employment-types', employmentTypeRoutes);

router.use('/performance', performanceRoutes);

router.use('/education-course', educationCourseMapRoutes);

router.use('/audit-logs', auditRoutes);

router.use('/system', systemRoutes);

router.use('/payroll', payrollRoutes);

router.use('/shifts', shiftRoutes);

module.exports = router;
