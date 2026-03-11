const asyncHandler = require('express-async-handler');
const { ParkingLot, User } = require('../../../models');

/**
 * GET /api/parking/prediction/:lotId
 * Returns AI-driven availability prediction for a specific lot.
 */
const getPrediction = asyncHandler(async (req, res) => {
    const { lotId } = req.params;
    const { Op } = require('sequelize');

    const lot = await ParkingLot.findByPk(lotId);
    if (!lot) {
        res.status(404);
        throw new Error('Parqueo no encontrado');
    }

    const currentOccupancy = await User.count({ where: { currentParkingLotId: lotId, currentParkingSpace: { [Op.ne]: null } } });
    const occupancyRate = (currentOccupancy / lot.totalSpaces) * 100;

    let status = "Alta";
    let color = "success";
    let message = "Espacios disponibles garantizados.";

    if (occupancyRate > 90) {
        status = "Crítica";
        color = "danger";
        message = "Casi lleno. Se recomienda buscar alternativas.";
    } else if (occupancyRate > 70) {
        status = "Baja";
        color = "warning";
        message = "Pocos espacios. Se llenará en aprox. 15 min.";
    } else if (occupancyRate > 40) {
        status = "Media";
        color = "tertiary";
        message = "Ocupación moderada.";
    }

    res.status(200).json({
        success: true,
        data: {
            status,
            color,
            message,
            probability: Math.max(5, 100 - Math.floor(occupancyRate))
        }
    });
});

module.exports = { getPrediction };
