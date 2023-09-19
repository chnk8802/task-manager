const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const sharp = require('sharp')
const User = require('../models/user');
const auth = require('../middleware/auth');
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account')
const router = new express.Router();

// Create User or SignUp
router.post('/users/signup', async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save();
        sendWelcomeEmail(user.email, user.name, user.password);
        const token = await user.generateAuthToken();
        res.status(201).send({ message: 'User created successfully', user });
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
});

// Login a User
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.cookie('token', token, {
            maxAge: 1000 * 60 * 60 * 6, // Cookie expiration time (e.g., 6 hour)
        });
        res.send({ message: `Logged In Successfully! You are Welcome ${user.name}` });
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
});

router.get('/users/validate', auth, async (req, res)=>{
    const token = req.header('Cookie').replace('token=', "")
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use of Auth token created using jwt in user model.
        
            const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

        if (!user) {
            throw new Error();
        }
        res.send({isValidated:true});
});

// Logout a User
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        });
        await req.user.save();

        res.send({ message: 'User logged out successfully!' });
    } catch (e) {
        res.status(500).send({ error: 'Error logging out user' });
    }
});

// Logout All Users
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send('All users logged out!');
    } catch (e) {
        res.status(500).send(e);
    }
});

// User porfile
router.get('/users/me', auth, async (req, res) => {
    const user = await User.findById(req.user._id);
    res.send({user: req.user, message: `Welcome ${req.user.name}` });
});

// Update a User
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update]);
        await req.user.save();
        res.send({message: `Updated were successful`});
    } catch (e) {
        res.status(400).send({ Error: "Updates went Unsuccessful:(" });
    }
});

// Delete a User
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove();
        sendCancelationEmail(req.user.email, req.user.name);
        res.send(req.user);
    } catch (e) {
        res.status(500).send(e);
    }
});

// To upload an avatar
const upload = multer({
    limit: {
        FileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an Image.'))
        }
        cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
        const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
        if (!buffer) {
            throw new Error("Invalid File! Not uploaded")
        }
        req.user.avatar = buffer;
        await req.user.save();
        res.send({message: "Avatar uploaded successfully!"});
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

// To delete an avatar
router.delete('/users/me/avatar', auth, async (req, res) => {
    if (!req.user.avatar) {
        res.status(400).send('No avatar to delete!');
    }
    try {
        req.user.avatar = undefined
        await req.user.save();
        res.send({message: "Avatar Deleted successfully, upload a new one anytime:)"});
    } catch (e) {
        res.status(500).send({Error: "Couldn't Delete Avatar"});
    }
})

// To view an avatar
router.get('/users/:id/avatar', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user || !user.avatar) {
            throw new Error("No Avatar Found");
        }

        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    }
    catch (e) {
        res.status(400).send();
    }
})


module.exports = router;