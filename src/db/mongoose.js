const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URL, {dbName: 'task-manager'});