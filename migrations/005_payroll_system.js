const { pool } = require('../src/config/database');

async function up() {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    console.log('Creating payroll system tables...');

    // Salary Components (earnings, deductions, statutory)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS salary_components (
        id INT PRIMARY KEY AUTO_INCREMENT,
        component_code VARCHAR(20) UNIQUE NOT NULL,
        component_name VARCHAR(100) NOT NULL,
        component_type ENUM('earning', 'deduction', 'statutory') NOT NULL,
        calculation_type ENUM('fixed', 'percentage', 'formula') NOT NULL DEFAULT 'fixed',
        is_taxable BOOLEAN DEFAULT false,
        is_statutory BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_by INT,
        updated_by INT,
        INDEX idx_component_type (component_type),
        INDEX idx_is_active (is_active)
      )
    `);
    console.log('✓ salary_components table created');

    // Salary Structures (grade-wise or designation-wise)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS salary_structures (
        id INT PRIMARY KEY AUTO_INCREMENT,
        structure_name VARCHAR(100) NOT NULL,
        grade_id INT,
        designation_id INT,
        company_id INT,
        business_unit_id INT,
        effective_from DATE NOT NULL,
        effective_to DATE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_by INT,
        updated_by INT,
        INDEX idx_grade (grade_id),
        INDEX idx_designation (designation_id),
        INDEX idx_effective (effective_from, effective_to),
        INDEX idx_is_active (is_active)
      )
    `);
    console.log('✓ salary_structures table created');

    // Salary Structure Components (mapping components to structures with values)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS salary_structure_components (
        id INT PRIMARY KEY AUTO_INCREMENT,
        structure_id INT NOT NULL,
        component_id INT NOT NULL,
        default_value DECIMAL(10,2) DEFAULT 0,
        min_value DECIMAL(10,2),
        max_value DECIMAL(10,2),
        percentage_of VARCHAR(20),
        formula TEXT,
        is_mandatory BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (structure_id) REFERENCES salary_structures(id) ON DELETE CASCADE,
        FOREIGN KEY (component_id) REFERENCES salary_components(id) ON DELETE CASCADE,
        INDEX idx_structure (structure_id),
        INDEX idx_component (component_id)
      )
    `);
    console.log('✓ salary_structure_components table created');

    // Employee Salary Details (current salary - SCD Type 2)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS employee_salary_details (
        id INT PRIMARY KEY AUTO_INCREMENT,
        employee_id INT NOT NULL,
        structure_id INT,
        basic_salary DECIMAL(10,2) NOT NULL,
        total_earnings DECIMAL(10,2) NOT NULL DEFAULT 0,
        total_deductions DECIMAL(10,2) NOT NULL DEFAULT 0,
        net_salary DECIMAL(10,2) NOT NULL DEFAULT 0,
        effective_from DATE NOT NULL,
        effective_to DATE,
        is_current BOOLEAN DEFAULT true,
        revision_reason VARCHAR(255),
        approved_by INT,
        approved_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_by INT,
        updated_by INT,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (structure_id) REFERENCES salary_structures(id) ON DELETE SET NULL,
        INDEX idx_employee (employee_id),
        INDEX idx_effective (effective_from, effective_to),
        INDEX idx_is_current (is_current)
      )
    `);
    console.log('✓ employee_salary_details table created');

    // Employee Salary Components (individual component values for each employee)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS employee_salary_components (
        id INT PRIMARY KEY AUTO_INCREMENT,
        salary_detail_id INT NOT NULL,
        component_id INT NOT NULL,
        component_value DECIMAL(10,2) NOT NULL DEFAULT 0,
        calculation_value DECIMAL(10,2),
        remark VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (salary_detail_id) REFERENCES employee_salary_details(id) ON DELETE CASCADE,
        FOREIGN KEY (component_id) REFERENCES salary_components(id) ON DELETE CASCADE,
        INDEX idx_salary_detail (salary_detail_id),
        INDEX idx_component (component_id)
      )
    `);
    console.log('✓ employee_salary_components table created');

    // Payroll Runs (batch payroll processing)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payroll_runs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        payroll_month VARCHAR(7) NOT NULL COMMENT 'Format: YYYY-MM',
        run_name VARCHAR(100) NOT NULL,
        run_type ENUM('monthly', 'bonus', 'arrear', 'adjustment') DEFAULT 'monthly',
        company_id INT,
        business_unit_id INT,
        total_employees INT DEFAULT 0,
        total_gross DECIMAL(15,2) DEFAULT 0,
        total_deductions DECIMAL(15,2) DEFAULT 0,
        total_net DECIMAL(15,2) DEFAULT 0,
        status ENUM('draft', 'processing', 'completed', 'cancelled') DEFAULT 'draft',
        processed_by INT,
        processed_at TIMESTAMP NULL,
        approved_by INT,
        approved_at TIMESTAMP NULL,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_by INT,
        updated_by INT,
        UNIQUE KEY uk_payroll_month_company (payroll_month, company_id, business_unit_id),
        INDEX idx_payroll_month (payroll_month),
        INDEX idx_status (status)
      )
    `);
    console.log('✓ payroll_runs table created');

    // Payslips (generated for each employee in a payroll run)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payslips (
        id INT PRIMARY KEY AUTO_INCREMENT,
        payroll_run_id INT NOT NULL,
        employee_id INT NOT NULL,
        employee_code VARCHAR(50),
        employee_name VARCHAR(255),
        designation VARCHAR(100),
        department VARCHAR(100),
        pan_number VARCHAR(20),
        bank_account VARCHAR(50),
        bank_name VARCHAR(100),
        payroll_month VARCHAR(7) NOT NULL,
        working_days INT DEFAULT 0,
        present_days DECIMAL(5,2) DEFAULT 0,
        lop_days DECIMAL(5,2) DEFAULT 0,
        gross_earnings DECIMAL(10,2) DEFAULT 0,
        total_deductions DECIMAL(10,2) DEFAULT 0,
        net_pay DECIMAL(10,2) DEFAULT 0,
        arrears DECIMAL(10,2) DEFAULT 0,
        adjustments DECIMAL(10,2) DEFAULT 0,
        status ENUM('generated', 'approved', 'paid', 'cancelled') DEFAULT 'generated',
        paid_on DATE,
        payment_reference VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id) ON DELETE CASCADE,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        INDEX idx_payroll_run (payroll_run_id),
        INDEX idx_employee (employee_id),
        INDEX idx_payroll_month (payroll_month),
        INDEX idx_status (status)
      )
    `);
    console.log('✓ payslips table created');

    // Payslip Components (line items for each payslip)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payslip_components (
        id INT PRIMARY KEY AUTO_INCREMENT,
        payslip_id INT NOT NULL,
        component_id INT NOT NULL,
        component_name VARCHAR(100) NOT NULL,
        component_type ENUM('earning', 'deduction', 'statutory') NOT NULL,
        amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        calculation_details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (payslip_id) REFERENCES payslips(id) ON DELETE CASCADE,
        FOREIGN KEY (component_id) REFERENCES salary_components(id) ON DELETE CASCADE,
        INDEX idx_payslip (payslip_id),
        INDEX idx_component (component_id)
      )
    `);
    console.log('✓ payslip_components table created');

    // Tax Configurations
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tax_configurations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        tax_year VARCHAR(9) NOT NULL COMMENT 'Format: YYYY-YYYY',
        slab_min DECIMAL(10,2) NOT NULL DEFAULT 0,
        slab_max DECIMAL(10,2),
        tax_rate DECIMAL(5,2) NOT NULL,
        cess_rate DECIMAL(5,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tax_year (tax_year),
        INDEX idx_is_active (is_active)
      )
    `);
    console.log('✓ tax_configurations table created');

    // Provident Fund (PF) Configurations
    await connection.query(`
      CREATE TABLE IF NOT EXISTS pf_configurations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        effective_from DATE NOT NULL,
        employee_contribution_rate DECIMAL(5,2) NOT NULL DEFAULT 12.00,
        employer_contribution_rate DECIMAL(5,2) NOT NULL DEFAULT 12.00,
        employer_pension_rate DECIMAL(5,2) DEFAULT 8.33,
        wage_ceiling DECIMAL(10,2) DEFAULT 15000,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_effective (effective_from),
        INDEX idx_is_active (is_active)
      )
    `);
    console.log('✓ pf_configurations table created');

    // ESI Configurations
    await connection.query(`
      CREATE TABLE IF NOT EXISTS esi_configurations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        effective_from DATE NOT NULL,
        employee_contribution_rate DECIMAL(5,2) NOT NULL DEFAULT 0.75,
        employer_contribution_rate DECIMAL(5,2) NOT NULL DEFAULT 3.25,
        wage_ceiling DECIMAL(10,2) DEFAULT 21000,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_effective (effective_from),
        INDEX idx_is_active (is_active)
      )
    `);
    console.log('✓ esi_configurations table created');

    // Bonus/Incentive Records
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bonus_records (
        id INT PRIMARY KEY AUTO_INCREMENT,
        employee_id INT NOT NULL,
        bonus_type ENUM('performance', 'festival', 'retention', 'referral', 'other') NOT NULL,
        bonus_month VARCHAR(7) NOT NULL,
        bonus_amount DECIMAL(10,2) NOT NULL,
        taxable_amount DECIMAL(10,2),
        tax_deducted DECIMAL(10,2) DEFAULT 0,
        net_amount DECIMAL(10,2),
        reason VARCHAR(255),
        status ENUM('pending', 'approved', 'paid', 'cancelled') DEFAULT 'pending',
        approved_by INT,
        approved_at TIMESTAMP NULL,
        paid_on DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_by INT,
        updated_by INT,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        INDEX idx_employee (employee_id),
        INDEX idx_bonus_month (bonus_month),
        INDEX idx_status (status)
      )
    `);
    console.log('✓ bonus_records table created');

    // Insert default salary components
    await connection.query(`
      INSERT IGNORE INTO salary_components (component_code, component_name, component_type, calculation_type, is_taxable, is_statutory, display_order) VALUES
      ('BASIC', 'Basic Salary', 'earning', 'fixed', true, false, 1),
      ('HRA', 'House Rent Allowance', 'earning', 'percentage', true, false, 2),
      ('DA', 'Dearness Allowance', 'earning', 'percentage', true, false, 3),
      ('CA', 'Conveyance Allowance', 'earning', 'fixed', true, false, 4),
      ('MA', 'Medical Allowance', 'earning', 'fixed', false, false, 5),
      ('SA', 'Special Allowance', 'earning', 'fixed', true, false, 6),
      ('PF', 'Provident Fund', 'statutory', 'percentage', false, true, 1),
      ('ESI', 'Employee State Insurance', 'statutory', 'percentage', false, true, 2),
      ('PT', 'Professional Tax', 'deduction', 'fixed', false, false, 1),
      ('TDS', 'Tax Deducted at Source', 'deduction', 'formula', false, false, 2),
      ('LOP', 'Loss of Pay', 'deduction', 'formula', false, false, 3)
    `);
    console.log('✓ Default salary components inserted');

    // Insert default tax slabs for current year
    const currentYear = new Date().getFullYear();
    await connection.query(`
      INSERT IGNORE INTO tax_configurations (tax_year, slab_min, slab_max, tax_rate, cess_rate) VALUES
      (?, 0, 250000, 0, 0),
      (?, 250001, 500000, 5, 4),
      (?, 500001, 1000000, 20, 4),
      (?, 1000001, NULL, 30, 4)
    `, [`${currentYear}-${currentYear+1}`, `${currentYear}-${currentYear+1}`, `${currentYear}-${currentYear+1}`, `${currentYear}-${currentYear+1}`]);
    console.log('✓ Default tax configurations inserted');

    // Insert default PF configuration
    await connection.query(`
      INSERT IGNORE INTO pf_configurations (effective_from, employee_contribution_rate, employer_contribution_rate, employer_pension_rate, wage_ceiling) VALUES
      ('2024-01-01', 12.00, 12.00, 8.33, 15000)
    `);
    console.log('✓ Default PF configuration inserted');

    // Insert default ESI configuration
    await connection.query(`
      INSERT IGNORE INTO esi_configurations (effective_from, employee_contribution_rate, employer_contribution_rate, wage_ceiling) VALUES
      ('2024-01-01', 0.75, 3.25, 21000)
    `);
    console.log('✓ Default ESI configuration inserted');

    await connection.commit();
    console.log('\n✅ Payroll system migration completed successfully!');
    return true;

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

async function down() {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    console.log('Rolling back payroll system tables...');

    await connection.query('DROP TABLE IF EXISTS bonus_records');
    await connection.query('DROP TABLE IF EXISTS esi_configurations');
    await connection.query('DROP TABLE IF EXISTS pf_configurations');
    await connection.query('DROP TABLE IF EXISTS tax_configurations');
    await connection.query('DROP TABLE IF EXISTS payslip_components');
    await connection.query('DROP TABLE IF EXISTS payslips');
    await connection.query('DROP TABLE IF EXISTS payroll_runs');
    await connection.query('DROP TABLE IF EXISTS employee_salary_components');
    await connection.query('DROP TABLE IF EXISTS employee_salary_details');
    await connection.query('DROP TABLE IF EXISTS salary_structure_components');
    await connection.query('DROP TABLE IF EXISTS salary_structures');
    await connection.query('DROP TABLE IF EXISTS salary_components');

    await connection.commit();
    console.log('✅ Rollback completed successfully!');
    return true;

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌ Rollback failed:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  up()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { up, down };
