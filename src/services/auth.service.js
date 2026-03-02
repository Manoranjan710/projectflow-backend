const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {v4: uuidv4} = require('uuid');
const userRepository = require('../repositories/user.repository');
const AppError = require('../utils/AppError');

exports.register = async({name, email, password}) => {
    const existingUser = await userRepository.findByEmail(email);

    if(existingUser){
        throw new AppError(400, "Email already in use");
    }

    hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
        id: uuidv4(),
        name,
        email,
        password: hashedPassword,
        role: 'USER'
    };

    await userRepository.createUser(newUser);
    return {message:"User registered successfully"};
}

exports.login = async({email, password}) => {
    const user = await userRepository.findByEmail(email);

    if(!user){
        throw new AppError(401, "Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch){
        throw new AppError(401, "Invalid email or password");
    }

    const token = jwt.sign(
        {id: user.id, role: user.role},
        process.env.JWT_SECRET,
        {expiresIn: '1h'}
    );

    return {
        accessToken: token,
    };
};