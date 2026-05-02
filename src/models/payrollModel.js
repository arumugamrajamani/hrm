const { pool } = require('../config/database');

class PayrollModel {
  // Salary Components
  static async createSalaryComponent(data) {
    const { component_code, component_name, component_type, calculation_type, is_taxable, is_statutory, display_order, created_by } = data;
    const [result] = await pool.query(
      `INSERT INTO salary_components (component_code, component_name, component_type, calculation_type, is_taxable, is_statutory, display_order, created_by, updated_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [component_code, component_name, component_type, calculation_type, is_taxable, is_statutory, display_order, created_by, created_by]
    );
    return result.insertId;
  }

  static async getSalaryComponents(filters = {}) {
    let query = 'SELECT * FROM salary_components WHERE 1=1';
    const params = [];
    
    if (filters.component_type) {
      query += ' AND component_type = ?';
      params.push(filters.component_type);
    }
    if (filters.is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(filters.is_active);
    }
    
    query += ' ORDER BY display_order, component_name';
    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async getSalaryComponentById(id) {
    const [rows] = await pool.query('SELECT * FROM salary_components WHERE id = ?', [id]);
    return rows[0];
  }

  static async updateSalaryComponent(id, data) {
    const { component_code, component_name, component_type, calculation_type, is_taxable, is_statutory, display_order, is_active, updated_by } = data;
    await pool.query(
      `UPDATE salary_components SET component_code = ?, component_name = ?, component_type = ?, calculation_type = ?, is_taxable = ?, is_statutory = ?, display_order = ?, is_active = ?, updated_by = ? 
       WHERE id = ?`,
      [component_code, component_name, component_type, calculation_type, is_taxable, is_statutory, display_order, is_active, updated_by, id]
    );
  }

  static async deleteSalaryComponent(id) {
    await pool.query('UPDATE salary_components SET is_active = false WHERE id = ?', [id]);
  }

  // Salary Structures
  static async createSalaryStructure(data) {
    const { structure_name, grade_id, designation_id, company_id, business_unit_id, effective_from, effective_to, created_by } = data;
    const [result] = await pool.query(
      `INSERT INTO salary_structures (structure_name, grade_id, designation_id, company_id, business_unit_id, effective_from, effective_to, created_by, updated_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [structure_name, grade_id, designation_id, company_id, business_unit_id, effective_from, effective_to, created_by, created_by]
    );
    return result.insertId;
  }

  static async getSalaryStructures(filters = {}) {
    let query = `
      SELECT ss.*, g.grade_name, d.designation_name, c.company_name, bu.unit_name AS business_unit_name
      FROM salary_structures ss
      LEFT JOIN grades_master g ON ss.grade_id = g.id
      LEFT JOIN designations_master d ON ss.designation_id = d.id
      LEFT JOIN companies c ON ss.company_id = c.id
      LEFT JOIN business_units bu ON ss.business_unit_id = bu.id
      WHERE 1=1
    `;
    const params = [];
    
    if (filters.is_active !== undefined) {
      query += ' AND ss.is_active = ?';
      params.push(filters.is_active);
    }
    
    query += ' ORDER BY ss.effective_from DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async getSalaryStructureById(id) {
    const [rows] = await pool.query(
      `SELECT ss.*, g.grade_name, d.designation_name, c.company_name, bu.unit_name AS business_unit_name
       FROM salary_structures ss
       LEFT JOIN grades_master g ON ss.grade_id = g.id
       LEFT JOIN designations_master d ON ss.designation_id = d.id
       LEFT JOIN companies c ON ss.company_id = c.id
       LEFT JOIN business_units bu ON ss.business_unit_id = bu.id
       WHERE ss.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async updateSalaryStructure(id, data) {
    const { structure_name, grade_id, designation_id, company_id, business_unit_id, effective_from, effective_to, is_active, updated_by } = data;
    await pool.query(
      `UPDATE salary_structures SET structure_name = ?, grade_id = ?, designation_id = ?, company_id = ?, business_unit_id = ?, effective_from = ?, effective_to = ?, is_active = ?, updated_by = ? 
       WHERE id = ?`,
      [structure_name, grade_id, designation_id, company_id, business_unit_id, effective_from, effective_to, is_active, updated_by, id]
    );
  }

  static async deleteSalaryStructure(id) {
    await pool.query('UPDATE salary_structures SET is_active = false WHERE id = ?', [id]);
  }

  // Salary Structure Components
  static async addStructureComponent(data) {
    const { structure_id, component_id, default_value, min_value, max_value, percentage_of, formula, is_mandatory } = data;
    const [result] = await pool.query(
      `INSERT INTO salary_structure_components (structure_id, component_id, default_value, min_value, max_value, percentage_of, formula, is_mandatory) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [structure_id, component_id, default_value, min_value, max_value, percentage_of, formula, is_mandatory]
    );
    return result.insertId;
  }

  static async getStructureComponents(structure_id) {
    const [rows] = await pool.query(
      `SELECT ssc.*, sc.component_code, sc.component_name, sc.component_type, sc.calculation_type, sc.is_taxable
       FROM salary_structure_components ssc
       JOIN salary_components sc ON ssc.component_id = sc.id
       WHERE ssc.structure_id = ?`,
      [structure_id]
    );
    return rows;
  }

  static async updateStructureComponent(id, data) {
    const { default_value, min_value, max_value, percentage_of, formula, is_mandatory } = data;
    await pool.query(
      `UPDATE salary_structure_components SET default_value = ?, min_value = ?, max_value = ?, percentage_of = ?, formula = ?, is_mandatory = ? 
       WHERE id = ?`,
      [default_value, min_value, max_value, percentage_of, formula, is_mandatory, id]
    );
  }

  static async removeStructureComponent(id) {
    await pool.query('DELETE FROM salary_structure_components WHERE id = ?', [id]);
  }

  // Employee Salary Details (SCD Type 2)
  static async createEmployeeSalary(data) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Set previous salary record as not current
      if (data.employee_id) {
        await connection.query(
          'UPDATE employee_salary_details SET is_current = false, effective_to = DATE_SUB(?, INTERVAL 1 DAY) WHERE employee_id = ? AND is_current = true',
          [data.effective_from, data.employee_id]
        );
      }
      
      const { employee_id, structure_id, basic_salary, total_earnings, total_deductions, net_salary, effective_from, revision_reason, created_by } = data;
      const [result] = await connection.query(
        `INSERT INTO employee_salary_details (employee_id, structure_id, basic_salary, total_earnings, total_deductions, net_salary, effective_from, revision_reason, created_by, updated_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [employee_id, structure_id, basic_salary, total_earnings, total_deductions, net_salary, effective_from, revision_reason, created_by, created_by]
      );
      
      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getEmployeeSalaries(employee_id, current_only = true) {
    let query = 'SELECT * FROM employee_salary_details WHERE employee_id = ?';
    const params = [employee_id];
    
    if (current_only) {
      query += ' AND is_current = true';
    }
    
    query += ' ORDER BY effective_from DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async getCurrentSalary(employee_id) {
    const [rows] = await pool.query(
      'SELECT * FROM employee_salary_details WHERE employee_id = ? AND is_current = true LIMIT 1',
      [employee_id]
    );
    return rows[0];
  }

  static async updateEmployeeSalary(id, data) {
    const { basic_salary, total_earnings, total_deductions, net_salary, effective_to, revision_reason, updated_by } = data;
    await pool.query(
      `UPDATE employee_salary_details SET basic_salary = ?, total_earnings = ?, total_deductions = ?, net_salary = ?, effective_to = ?, revision_reason = ?, updated_by = ? 
       WHERE id = ?`,
      [basic_salary, total_earnings, total_deductions, net_salary, effective_to, revision_reason, updated_by, id]
    );
  }

  // Employee Salary Components
  static async addEmployeeSalaryComponent(data) {
    const { salary_detail_id, component_id, component_value, calculation_value, remark } = data;
    const [result] = await pool.query(
      `INSERT INTO employee_salary_components (salary_detail_id, component_id, component_value, calculation_value, remark) 
       VALUES (?, ?, ?, ?, ?)`,
      [salary_detail_id, component_id, component_value, calculation_value, remark]
    );
    return result.insertId;
  }

  static async getEmployeeSalaryComponents(salary_detail_id) {
    const [rows] = await pool.query(
      `SELECT esc.*, sc.component_code, sc.component_name, sc.component_type
       FROM employee_salary_components esc
       JOIN salary_components sc ON esc.component_id = sc.id
       WHERE esc.salary_detail_id = ?`,
      [salary_detail_id]
    );
    return rows;
  }

  // Payroll Runs
  static async createPayrollRun(data) {
    const { payroll_month, run_name, run_type, company_id, business_unit_id, created_by } = data;
    const [result] = await pool.query(
      `INSERT INTO payroll_runs (payroll_month, run_name, run_type, company_id, business_unit_id, created_by, updated_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [payroll_month, run_name, run_type, company_id, business_unit_id, created_by, created_by]
    );
    return result.insertId;
  }

  static async getPayrollRuns(filters = {}) {
    let query = `
      SELECT pr.*, c.company_name, bu.unit_name AS business_unit_name
      FROM payroll_runs pr
      LEFT JOIN companies c ON pr.company_id = c.id
      LEFT JOIN business_units bu ON pr.business_unit_id = bu.id
      WHERE 1=1
    `;
    const params = [];
    
    if (filters.payroll_month) {
      query += ' AND pr.payroll_month = ?';
      params.push(filters.payroll_month);
    }
    if (filters.status) {
      query += ' AND pr.status = ?';
      params.push(filters.status);
    }
    
    query += ' ORDER BY pr.payroll_month DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async getPayrollRunById(id) {
    const [rows] = await pool.query(
      `SELECT pr.*, c.company_name, bu.unit_name AS business_unit_name
       FROM payroll_runs pr
       LEFT JOIN companies c ON pr.company_id = c.id
       LEFT JOIN business_units bu ON pr.business_unit_id = bu.id
       WHERE pr.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async updatePayrollRun(id, data) {
    const { run_name, status, total_employees, total_gross, total_deductions, total_net, remarks, updated_by } = data;
    await pool.query(
      `UPDATE payroll_runs SET run_name = ?, status = ?, total_employees = ?, total_gross = ?, total_deductions = ?, total_net = ?, remarks = ?, updated_by = ? 
       WHERE id = ?`,
      [run_name, status, total_employees, total_gross, total_deductions, total_net, remarks, updated_by, id]
    );
  }

  // Payslips
  static async createPayslip(data) {
    const { payroll_run_id, employee_id, employee_code, employee_name, designation, department, pan_number, bank_account, bank_name, payroll_month, working_days, present_days, lop_days, gross_earnings, total_deductions, net_pay, arrears, adjustments } = data;
    const [result] = await pool.query(
      `INSERT INTO payslips (payroll_run_id, employee_id, employee_code, employee_name, designation, department, pan_number, bank_account, bank_name, payroll_month, working_days, present_days, lop_days, gross_earnings, total_deductions, net_pay, arrears, adjustments) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [payroll_run_id, employee_id, employee_code, employee_name, designation, department, pan_number, bank_account, bank_name, payroll_month, working_days, present_days, lop_days, gross_earnings, total_deductions, net_pay, arrears, adjustments]
    );
    return result.insertId;
  }

  static async getPayslips(filters = {}) {
    let query = 'SELECT * FROM payslips WHERE 1=1';
    const params = [];
    
    if (filters.payroll_run_id) {
      query += ' AND payroll_run_id = ?';
      params.push(filters.payroll_run_id);
    }
    if (filters.employee_id) {
      query += ' AND employee_id = ?';
      params.push(filters.employee_id);
    }
    if (filters.payroll_month) {
      query += ' AND payroll_month = ?';
      params.push(filters.payroll_month);
    }
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    
    query += ' ORDER BY payroll_month DESC, employee_code';
    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async getPayslipById(id) {
    const [rows] = await pool.query('SELECT * FROM payslips WHERE id = ?', [id]);
    return rows[0];
  }

  static async updatePayslip(id, data) {
    const { working_days, present_days, lop_days, gross_earnings, total_deductions, net_pay, arrears, adjustments, status, updated_by } = data;
    await pool.query(
      `UPDATE payslips SET working_days = ?, present_days = ?, lop_days = ?, gross_earnings = ?, total_deductions = ?, net_pay = ?, arrears = ?, adjustments = ?, status = ?, updated_by = ? 
       WHERE id = ?`,
      [working_days, present_days, lop_days, gross_earnings, total_deductions, net_pay, arrears, adjustments, status, updated_by, id]
    );
  }

  // Payslip Components
  static async addPayslipComponent(data) {
    const { payslip_id, component_id, component_name, component_type, amount, calculation_details } = data;
    const [result] = await pool.query(
      `INSERT INTO payslip_components (payslip_id, component_id, component_name, component_type, amount, calculation_details) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [payslip_id, component_id, component_name, component_type, amount, calculation_details]
    );
    return result.insertId;
  }

  static async getPayslipComponents(payslip_id) {
    const [rows] = await pool.query(
      'SELECT * FROM payslip_components WHERE payslip_id = ? ORDER BY component_type, component_name',
      [payslip_id]
    );
    return rows;
  }

  // Tax Configurations
  static async createTaxConfig(data) {
    const { tax_year, slab_min, slab_max, tax_rate, cess_rate } = data;
    const [result] = await pool.query(
      `INSERT INTO tax_configurations (tax_year, slab_min, slab_max, tax_rate, cess_rate) 
       VALUES (?, ?, ?, ?, ?)`,
      [tax_year, slab_min, slab_max, tax_rate, cess_rate]
    );
    return result.insertId;
  }

  static async getTaxConfigs(filters = {}) {
    let query = 'SELECT * FROM tax_configurations WHERE 1=1';
    const params = [];
    
    if (filters.tax_year) {
      query += ' AND tax_year = ?';
      params.push(filters.tax_year);
    }
    if (filters.is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(filters.is_active);
    }
    
    query += ' ORDER BY tax_year DESC, slab_min';
    const [rows] = await pool.query(query, params);
    return rows;
  }

  // PF Configurations
  static async getPFConfig(effective_date = null) {
    let query = 'SELECT * FROM pf_configurations WHERE is_active = true';
    const params = [];
    
    if (effective_date) {
      query += ' AND effective_from <= ?';
      params.push(effective_date);
    }
    
    query += ' ORDER BY effective_from DESC LIMIT 1';
    const [rows] = await pool.query(query, params);
    return rows[0];
  }

  // ESI Configurations
  static async getESIConfig(effective_date = null) {
    let query = 'SELECT * FROM esi_configurations WHERE is_active = true';
    const params = [];
    
    if (effective_date) {
      query += ' AND effective_from <= ?';
      params.push(effective_date);
    }
    
    query += ' ORDER BY effective_from DESC LIMIT 1';
    const [rows] = await pool.query(query, params);
    return rows[0];
  }

  // Bonus Records
  static async createBonusRecord(data) {
    const { employee_id, bonus_type, bonus_month, bonus_amount, taxable_amount, tax_deducted, net_amount, reason, created_by } = data;
    const [result] = await pool.query(
      `INSERT INTO bonus_records (employee_id, bonus_type, bonus_month, bonus_amount, taxable_amount, tax_deducted, net_amount, reason, created_by, updated_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [employee_id, bonus_type, bonus_month, bonus_amount, taxable_amount, tax_deducted, net_amount, reason, created_by, created_by]
    );
    return result.insertId;
  }

  static async getBonusRecords(filters = {}) {
    let query = `
      SELECT br.*, e.employee_code, CONCAT(e.first_name, ' ', e.last_name) as employee_name
      FROM bonus_records br
      JOIN employees e ON br.employee_id = e.id
      WHERE 1=1
    `;
    const params = [];
    
    if (filters.employee_id) {
      query += ' AND br.employee_id = ?';
      params.push(filters.employee_id);
    }
    if (filters.bonus_month) {
      query += ' AND br.bonus_month = ?';
      params.push(filters.bonus_month);
    }
    if (filters.status) {
      query += ' AND br.status = ?';
      params.push(filters.status);
    }
    
    query += ' ORDER BY br.bonus_month DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async updateBonusRecord(id, data) {
    const { bonus_amount, taxable_amount, tax_deducted, net_amount, status, approved_by, paid_on, updated_by } = data;
    await pool.query(
      `UPDATE bonus_records SET bonus_amount = ?, taxable_amount = ?, tax_deducted = ?, net_amount = ?, status = ?, approved_by = ?, paid_on = ?, updated_by = ? 
       WHERE id = ?`,
      [bonus_amount, taxable_amount, tax_deducted, net_amount, status, approved_by, paid_on, updated_by, id]
    );
  }
}

module.exports = PayrollModel;
