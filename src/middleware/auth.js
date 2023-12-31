// const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user')

const auth = async (req, res, next) => {
    try {
        const token = req.header('Cookie').replace('token=', "")
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use of Auth token created using jwt in user model.
        
            const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

        if (!user) {
            throw new Error();
        }
        
        req.token = token;
        req.user = user;
        
        next();
    } catch (e) {
        res.status(401).send({ error: 'Please authenticate.' })
    }
};

module.exports = auth;