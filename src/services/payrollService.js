const PayrollModel = require('../models/payrollModel');

class PayrollService {
  // Salary Components
  async createSalaryComponent(data) {
    return await PayrollModel.createSalaryComponent(data);
  }

  async getSalaryComponents(filters = {}) {
    return await PayrollModel.getSalaryComponents(filters);
  }

  async getSalaryComponentById(id) {
    const component = await PayrollModel.getSalaryComponentById(id);
    if (!component) throw new Error('Salary component not found');
    return component;
  }

  async updateSalaryComponent(id, data) {
    await this.getSalaryComponentById(id);
    await PayrollModel.updateSalaryComponent(id, data);
  }

  async deleteSalaryComponent(id) {
    await this.getSalaryComponentById(id);
    await PayrollModel.deleteSalaryComponent(id);
  }

  // Salary Structures
  async createSalaryStructure(data) {
    return await PayrollModel.createSalaryStructure(data);
  }

  async getSalaryStructures(filters = {}) {
    return await PayrollModel.getSalaryStructures(filters);
  }

  async getSalaryStructureById(id) {
    const structure = await PayrollModel.getSalaryStructureById(id);
    if (!structure) throw new Error('Salary structure not found');
    
    const components = await PayrollModel.getStructureComponents(id);
    structure.components = components;
    
    return structure;
  }

  async updateSalaryStructure(id, data) {
    await this.getSalaryStructureById(id);
    await PayrollModel.updateSalaryStructure(id, data);
  }

  async deleteSalaryStructure(id) {
    await this.getSalaryStructureById(id);
    await PayrollModel.deleteSalaryStructure(id);
  }

  async addStructureComponent(data) {
    return await PayrollModel.addStructureComponent(data);
  }

  async updateStructureComponent(id, data) {
    await PayrollModel.updateStructureComponent(id, data);
  }

  async removeStructureComponent(id) {
    await PayrollModel.removeStructureComponent(id);
  }

  // Employee Salary
  async createEmployeeSalary(data) {
    // Calculate totals if not provided
    if (!data.total_earnings || !data.total_deductions || !data.net_salary) {
      const components = data.components || [];
      let totalEarnings = 0;
      let totalDeductions = 0;
      
      for (const comp of components) {
        if (comp.component_type === 'earning') {
          totalEarnings += parseFloat(comp.component_value) || 0;
        } else if (comp.component_type === 'deduction' || comp.component_type === 'statutory') {
          totalDeductions += parseFloat(comp.component_value) || 0;
        }
      }
      
      data.total_earnings = totalEarnings;
      data.total_deductions = totalDeductions;
      data.net_salary = data.basic_salary + totalEarnings - totalDeductions;
    }
    
    const salaryId = await PayrollModel.createEmployeeSalary(data);
    
    // Add components if provided
    if (data.components && data.components.length > 0) {
      for (const comp of data.components) {
        await PayrollModel.addEmployeeSalaryComponent({
          salary_detail_id: salaryId,
          component_id: comp.component_id,
          component_value: comp.component_value,
          calculation_value: comp.calculation_value,
          remark: comp.remark
        });
      }
    }
    
    return salaryId;
  }

  async getEmployeeSalaries(employee_id, current_only = true) {
    const salaries = await PayrollModel.getEmployeeSalaries(employee_id, current_only);
    
    for (const salary of salaries) {
      salary.components = await PayrollModel.getEmployeeSalaryComponents(salary.id);
    }
    
    return salaries;
  }

  async getCurrentSalary(employee_id) {
    const salary = await PayrollModel.getCurrentSalary(employee_id);
    if (salary) {
      salary.components = await PayrollModel.getEmployeeSalaryComponents(salary.id);
    }
    return salary;
  }

  async updateEmployeeSalary(id, data) {
    await PayrollModel.updateEmployeeSalary(id, data);
  }

  // Payroll Runs
  async createPayrollRun(data) {
    return await PayrollModel.createPayrollRun(data);
  }

  async getPayrollRuns(filters = {}) {
    return await PayrollModel.getPayrollRuns(filters);
  }

  async getPayrollRunById(id) {
    const run = await PayrollModel.getPayrollRunById(id);
    if (!run) throw new Error('Payroll run not found');
    
    const payslips = await PayrollModel.getPayslips({ payroll_run_id: id });
    run.payslips = payslips;
    
    return run;
  }

  async updatePayrollRun(id, data) {
    await this.getPayrollRunById(id);
    await PayrollModel.updatePayrollRun(id, data);
  }

  async processPayrollRun(run_id) {
    const run = await PayrollModel.getPayrollRunById(run_id);
    if (!run) throw new Error('Payroll run not found');
    await PayrollModel.updatePayrollRun(run_id, { status: 'processing' });
    return { message: 'Payroll processing initiated' };
  }

  // Payslips
  async createPayslip(data) {
    return await PayrollModel.createPayslip(data);
  }

  async getPayslips(filters = {}) {
    return await PayrollModel.getPayslips(filters);
  }

  async getPayslipById(id) {
    const payslip = await PayrollModel.getPayslipById(id);
    if (!payslip) throw new Error('Payslip not found');
    
    payslip.components = await PayrollModel.getPayslipComponents(id);
    return payslip;
  }

  async updatePayslip(id, data) {
    await this.getPayslipById(id);
    await PayrollModel.updatePayslip(id, data);
  }

  // Tax
  async calculateTax(annual_income, tax_year) {
    const taxConfigs = await PayrollModel.getTaxConfigs({ tax_year, is_active: true });
    
    let totalTax = 0;
    for (const config of taxConfigs) {
      const slabMin = parseFloat(config.slab_min);
      const slabMax = config.slab_max ? parseFloat(config.slab_max) : Infinity;
      const taxRate = parseFloat(config.tax_rate);
      const cessRate = parseFloat(config.cess_rate || 0);
      
      if (annual_income > slabMin) {
        const taxableInSlab = Math.min(annual_income, slabMax) - slabMin;
        const taxInSlab = taxableInSlab * (taxRate / 100);
        totalTax += taxInSlab;
      }
    }
    
    // Add cess
    const cess = totalTax * 0.04; // 4% cess
    totalTax += cess;
    
    return {
      annual_income,
      total_tax: Math.round(totalTax),
      cess: Math.round(cess)
    };
  }

  // Bonus
  async createBonusRecord(data) {
    return await PayrollModel.createBonusRecord(data);
  }

  async getBonusRecords(filters = {}) {
    return await PayrollModel.getBonusRecords(filters);
  }

  async updateBonusRecord(id, data) {
    await PayrollModel.updateBonusRecord(id, data);
  }

  // Get PF/ESI Configs
  async getPFConfig(effective_date) {
    return await PayrollModel.getPFConfig(effective_date);
  }

  async getESIConfig(effective_date) {
    return await PayrollModel.getESIConfig(effective_date);
  }
}

module.exports = new PayrollService();
