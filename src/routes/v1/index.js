const express = require('express');
const router = express.Router();

const authRoutes = require('../authRoutes');
const userRoutes = require('../userRoutes');
const employeeRoutes = require('../employeeRoutes');
const departmentRoutes = require('../departmentRoutes');
const locationRoutes = require('../locationRoutes');
const designationRoutes = require('../designationRoutes');
const educationRoutes = require('../educationRoutes');
const courseRoutes = require('../courseRoutes');
const educationCourseMapRoutes = require('../educationCourseMapRoutes');
const auditRoutes = require('../auditRoutes');
const systemRoutes = require('../systemRoutes');

router.use('/auth', authRoutes);

router.use('/users', userRoutes);

router.use('/employees', employeeRoutes);

router.use('/departments', departmentRoutes);

router.use('/locations', locationRoutes);

router.use('/designations', designationRoutes);

router.use('/education', educationRoutes);

router.use('/courses', courseRoutes);

router.use('/education-course', educationCourseMapRoutes);

router.use('/audit-logs', auditRoutes);

router.use('/system', systemRoutes);

module.exports = router;
