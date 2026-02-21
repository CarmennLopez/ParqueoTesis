// src/controllers/parking/solvency.controller.js
/**
 * Controlador de solvencia mensual de parqueo.
 * - updateSolvency     → Admin/Guard: marca usuario como solvente por 1 mes
 * - checkSolvencyByCardId → Admin/Guard/Student: consulta estado por carné
 * - getSolvencyReport  → Admin: lista todos los usuarios estudiantes con su estado
 */
const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const { User } = require('../../models');
const { logAudit } = require('../../utils/auditLogger');
const { SOLVENCY_MONTHS, ROLES_EXEMPT_FROM_SOLVENCY } = require('../../config/constants');

/**
 * PUT /api/parking/solvency/:userId
 * Marca a un usuario como solvente por 1 mes (o N especificados en body).
 * Acceso: admin, guard
 */
const updateSolvency = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { months } = req.body;
    const adminId = req.userId;

    const months_to_add = parseInt(months) || SOLVENCY_MONTHS;

    if (months_to_add < 1 || months_to_add > 12) {
        res.status(400);
        throw new Error('El número de meses debe estar entre 1 y 12');
    }

    const user = await User.findByPk(userId);
    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado');
    }

    // Calcular nueva fecha de vencimiento
    // Si ya tiene solvencia vigente, extender desde la fecha actual de vencimiento
    const now = new Date();
    const baseDate = (user.solvencyExpires && new Date(user.solvencyExpires) > now)
        ? new Date(user.solvencyExpires)
        : now;

    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + months_to_add);
    // Ajustar al último día si el mes tiene menos días (ej: 31 marzo + 1 mes = 30 abril)
    if (newExpiry.getDate() !== baseDate.getDate()) {
        newExpiry.setDate(0);
    }

    user.isSolvent = true;
    user.solvencyExpires = newExpiry;
    user.solvencyUpdatedBy = adminId;
    await user.save();

    logAudit(req, 'SOLVENCY_UPDATED', 'User', {
        targetUserId: userId,
        months: months_to_add,
        newExpiry: newExpiry.toISOString()
    });

    res.status(200).json({
        success: true,
        message: `Solvencia actualizada correctamente por ${months_to_add} mes(es)`,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            cardId: user.cardId,
            isSolvent: user.isSolvent,
            solvencyExpires: user.solvencyExpires
        }
    });
});

/**
 * GET /api/parking/solvency/:cardId
 * Consulta el estado de solvencia de un usuario por su carné.
 * Acceso: admin, guard, student (para su propio carné)
 */
const checkSolvencyByCardId = asyncHandler(async (req, res) => {
    const { cardId } = req.params;

    const user = await User.findOne({
        where: { cardId },
        attributes: ['id', 'name', 'email', 'role', 'cardId', 'vehiclePlate', 'isSolvent', 'solvencyExpires', 'currentParkingSpace']
    });

    if (!user) {
        res.status(404);
        throw new Error(`No se encontró ningún usuario con el carné: ${cardId}`);
    }

    const now = new Date();
    const isExempt = ROLES_EXEMPT_FROM_SOLVENCY.includes(user.role);
    const isCurrentlySolvent = isExempt ||
        (user.isSolvent === true && user.solvencyExpires && new Date(user.solvencyExpires) > now);

    const daysRemaining = user.solvencyExpires
        ? Math.max(0, Math.ceil((new Date(user.solvencyExpires) - now) / (1000 * 60 * 60 * 24)))
        : 0;

    res.status(200).json({
        success: true,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            cardId: user.cardId,
            vehiclePlate: user.vehiclePlate,
            currentParkingSpace: user.currentParkingSpace
        },
        solvency: {
            isSolvent: isCurrentlySolvent,
            isExemptRole: isExempt,
            solvencyExpires: user.solvencyExpires || null,
            daysRemaining: isExempt ? null : daysRemaining,
            status: isExempt
                ? 'EXEMPT'
                : isCurrentlySolvent
                    ? `VIGENTE (${daysRemaining} días restantes)`
                    : 'VENCIDA'
        }
    });
});

/**
 * GET /api/parking/solvency-report
 * Lista todos los usuarios estudiantes con su estado de solvencia.
 * Acceso: admin
 */
const getSolvencyReport = asyncHandler(async (req, res) => {
    const now = new Date();

    const users = await User.findAll({
        where: { role: 'student' },
        attributes: ['id', 'name', 'email', 'cardId', 'vehiclePlate', 'isSolvent', 'solvencyExpires'],
        order: [['solvencyExpires', 'ASC']]
    });

    const report = users.map(u => {
        const isCurrentlySolvent = u.isSolvent && u.solvencyExpires && new Date(u.solvencyExpires) > now;
        const daysRemaining = u.solvencyExpires
            ? Math.max(0, Math.ceil((new Date(u.solvencyExpires) - now) / (1000 * 60 * 60 * 24)))
            : 0;
        return {
            id: u.id,
            name: u.name,
            email: u.email,
            cardId: u.cardId,
            vehiclePlate: u.vehiclePlate,
            isSolvent: isCurrentlySolvent,
            solvencyExpires: u.solvencyExpires,
            daysRemaining: isCurrentlySolvent ? daysRemaining : 0,
            status: isCurrentlySolvent ? 'VIGENTE' : 'VENCIDA'
        };
    });

    const solventCount = report.filter(u => u.isSolvent).length;
    const expiredCount = report.length - solventCount;

    res.status(200).json({
        success: true,
        summary: {
            total: report.length,
            solvent: solventCount,
            expired: expiredCount
        },
        data: report
    });
});

module.exports = { updateSolvency, checkSolvencyByCardId, getSolvencyReport };
