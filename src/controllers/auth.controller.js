const authService = require('../services/auth.service');

exports.register = async(req, res, next) => {
    try{
        const result = await authService.register(req.body);
        res.status(201).json({
            success:true,
            data: null,
            message: result.message
        });
    }catch(err){
        next(err);
    }                   
};

exports.login = async(req, res, next) => {
    try{
        const result = await authService.login(req.body);
        res.status(200).json({
            success:true,
            data: result,
            message: "Login successful"
        });
    }catch(err){
        next(err);  
    }
};