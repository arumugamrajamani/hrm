const express = require('express');
const router = express.Router();

const authRoutes = require('../authRoutes');
const userRoutes = require('../userRoutes');
const departmentRoutes = require('../departmentRoutes');
const educationRoutes = require('../educationRoutes');
const courseRoutes = require('../courseRoutes');
const educationCourseMapRoutes = require('../educationCourseMapRoutes');
const auditRoutes = require('../auditRoutes');

router.use('/auth', authRoutes);

router.use('/users', userRoutes);

router.use('/departments', departmentRoutes);

router.use('/education', educationRoutes);

router.use('/courses', courseRoutes);

router.use('/education-course', educationCourseMapRoutes);

router.use('/audit-logs', auditRoutes);

module.exports = router;
