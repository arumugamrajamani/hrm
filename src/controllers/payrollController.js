const payrollService = require('../services/payrollService');
const { successResponse, noDataResponse } = require('../utils/helpers');

class PayrollController {
  async createSalaryComponent(req, res, next) {
    try {
      const componentId = await payrollService.createSalaryComponent({
        ...req.body,
        created_by: req.user?.id
      });
      return successResponse(res, { id: componentId }, 'Salary component created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getSalaryComponents(req, res, next) {
    try {
      const components = await payrollService.getSalaryComponents(req.query);
      
      if (!components || components.length === 0) {
        return noDataResponse(res, 'No salary components found');
      }
      return successResponse(res, components, 'Salary components retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getSalaryComponentById(req, res, next) {
    try {
      const component = await payrollService.getSalaryComponentById(req.params.id);
      if (!component) {
        const error = new Error('Salary component not found');
        error.statusCode = 404;
        throw error;
      }
      return successResponse(res, component, 'Salary component retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateSalaryComponent(req, res, next) {
    try {
      await payrollService.updateSalaryComponent(req.params.id, {
        ...req.body,
        updated_by: req.user?.id
      });
      return successResponse(res, null, 'Salary component updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteSalaryComponent(req, res, next) {
    try {
      await payrollService.deleteSalaryComponent(req.params.id);
      return successResponse(res, null, 'Salary component deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async createSalaryStructure(req, res, next) {
    try {
      const structureId = await payrollService.createSalaryStructure({
        ...req.body,
        created_by: req.user?.id
      });
      return successResponse(res, { id: structureId }, 'Salary structure created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getSalaryStructures(req, res, next) {
    try {
      const structures = await payrollService.getSalaryStructures(req.query);
      
      if (!structures || structures.length === 0) {
        return noDataResponse(res, 'No salary structures found');
      }
      return successResponse(res, structures, 'Salary structures retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getSalaryStructureById(req, res, next) {
    try {
      const structure = await payrollService.getSalaryStructureById(req.params.id);
      if (!structure) {
        return noDataResponse(res, 'Salary structure not found');
      }
      return successResponse(res, structure, 'Salary structure retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateSalaryStructure(req, res, next) {
    try {
      await payrollService.updateSalaryStructure(req.params.id, {
        ...req.body,
        updated_by: req.user?.id
      });
      return successResponse(res, null, 'Salary structure updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteSalaryStructure(req, res, next) {
    try {
      await payrollService.deleteSalaryStructure(req.params.id);
      return successResponse(res, null, 'Salary structure deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async addStructureComponent(req, res, next) {
    try {
      const componentId = await payrollService.addStructureComponent(req.body);
      return successResponse(res, { id: componentId }, 'Structure component added successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getStructureComponents(req, res, next) {
    try {
      const components = await payrollService.getStructureComponents(req.params.structureId);
      return successResponse(res, components, 'Structure components retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateStructureComponent(req, res, next) {
    try {
      await payrollService.updateStructureComponent(req.params.componentId, req.body);
      return successResponse(res, null, 'Structure component updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async removeStructureComponent(req, res, next) {
    try {
      await payrollService.removeStructureComponent(req.params.componentId);
      return successResponse(res, null, 'Structure component removed successfully');
    } catch (error) {
      next(error);
    }
  }

  async createEmployeeSalary(req, res, next) {
    try {
      const salaryId = await payrollService.createEmployeeSalary({
        ...req.body,
        created_by: req.user?.id
      });
      return successResponse(res, { id: salaryId }, 'Employee salary record created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getEmployeeSalaries(req, res, next) {
    try {
      const current_only = req.query.current_only !== 'false';
      const salaries = await payrollService.getEmployeeSalaries(req.params.employeeId, current_only);
      
      if (!salaries || salaries.length === 0) {
        return noDataResponse(res, 'No salary records found');
      }
      return successResponse(res, salaries, 'Employee salary records retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getCurrentSalary(req, res, next) {
    try {
      const salary = await payrollService.getCurrentSalary(req.params.employeeId);
      if (!salary) {
        return noDataResponse(res, 'No current salary found');
      }
      return successResponse(res, salary, 'Current salary retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateEmployeeSalary(req, res, next) {
    try {
      await payrollService.updateEmployeeSalary(req.params.id, {
        ...req.body,
        updated_by: req.user?.id
      });
      return successResponse(res, null, 'Employee salary updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async createPayrollRun(req, res, next) {
    try {
      const runId = await payrollService.createPayrollRun({
        ...req.body,
        created_by: req.user?.id
      });
      return successResponse(res, { id: runId }, 'Payroll run created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getPayrollRuns(req, res, next) {
    try {
      const runs = await payrollService.getPayrollRuns(req.query);
      
      if (!runs || runs.length === 0) {
        return noDataResponse(res, 'No payroll runs found');
      }
      return successResponse(res, runs, 'Payroll runs retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getPayrollRunById(req, res, next) {
    try {
      const run = await payrollService.getPayrollRunById(req.params.id);
      if (!run) {
        return noDataResponse(res, 'Payroll run not found');
      }
      return successResponse(res, run, 'Payroll run retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updatePayrollRun(req, res, next) {
    try {
      await payrollService.updatePayrollRun(req.params.id, {
        ...req.body,
        updated_by: req.user?.id
      });
      return successResponse(res, null, 'Payroll run updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async processPayrollRun(req, res, next) {
    try {
      const result = await payrollService.processPayrollRun(req.params.id);
      return successResponse(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  async createPayslip(req, res, next) {
    try {
      const payslipId = await payrollService.createPayslip(req.body);
      return successResponse(res, { id: payslipId }, 'Payslip created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getPayslips(req, res, next) {
    try {
      const payslips = await payrollService.getPayslips(req.query);
      
      if (!payslips || payslips.length === 0) {
        return noDataResponse(res, 'No payslips found');
      }
      return successResponse(res, payslips, 'Payslips retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getPayslipById(req, res, next) {
    try {
      const payslip = await payrollService.getPayslipById(req.params.id);
      if (!payslip) {
        return noDataResponse(res, 'Payslip not found');
      }
      return successResponse(res, payslip, 'Payslip retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updatePayslip(req, res, next) {
    try {
      await payrollService.updatePayslip(req.params.id, {
        ...req.body,
        updated_by: req.user?.id
      });
      return successResponse(res, null, 'Payslip updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async calculateTax(req, res, next) {
    try {
      const { annual_income, tax_year } = req.body;
      const result = await payrollService.calculateTax(annual_income, tax_year);
      return successResponse(res, result, 'Tax calculated successfully');
    } catch (error) {
      next(error);
    }
  }

  async createBonusRecord(req, res, next) {
    try {
      const bonusId = await payrollService.createBonusRecord({
        ...req.body,
        created_by: req.user?.id
      });
      return successResponse(res, { id: bonusId }, 'Bonus record created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getBonusRecords(req, res, next) {
    try {
      const records = await payrollService.getBonusRecords(req.query);
      
      if (!records || records.length === 0) {
        return noDataResponse(res, 'No bonus records found');
      }
      return successResponse(res, records, 'Bonus records retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateBonusRecord(req, res, next) {
    try {
      await payrollService.updateBonusRecord(req.params.id, {
        ...req.body,
        updated_by: req.user?.id
      });
      return successResponse(res, null, 'Bonus record updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async getPFConfig(req, res, next) {
    try {
      const config = await payrollService.getPFConfig(req.query.effective_date);
      
      if (!config) {
        return noDataResponse(res, 'No PF configuration found');
      }
      return successResponse(res, config, 'PF configuration retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getESIConfig(req, res, next) {
    try {
      const config = await payrollService.getESIConfig(req.query.effective_date);
      
      if (!config) {
        return noDataResponse(res, 'No ESI configuration found');
      }
      return successResponse(res, config, 'ESI configuration retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PayrollController();
