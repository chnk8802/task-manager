const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth')
const router = new express.Router();
// Create Task
router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    try {
        await task.save();
        res.status(201).send({task, message: "Task Added Successfully"});
    } catch (e) {
        res.status(400).send({Error :"Error occured while creating task"});
    }
});

// Read all tasks
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    try {
        await req.user.populate({
                path: 'tasks',
                match,
                options: {
                    limit: parseInt(req.query.limit),
                    skip: parseInt(req.query.skip),
                    sort
                        }
        })
        res.status(200).send(req.user.tasks)
        // const tasks = await Task.find({ owner: req.user._id});
        // res.status(200).send(tasks);
    } catch (e) {
        res.status(500).send({Error:"No Task(s) Found!"});
    }
});

// Read Task by id
router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;
    try {
        const task = await Task.findOne({ _id, owner: req.user._id});
        if (!task) {
            return res.status(404).send({Error: "Sorry! No such task found."});
        }
        res.send(task);
    } catch (e) {
        res.status(500).send({Error: "Couldn't Delete Task :("});
    }

})

// Update a Task
router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['title', 'description', 'completed'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!'});
    }
        
        try {
            const task = await Task.findOne({ _id: req.params.id, owner: req.user._id});


            if (!task) {
                res.status(404).send({Error: "Sorry! No such task found."});
            }
            
            updates.forEach((update) => task[update] = req.body[update]);
            await task.save();

            res.send(task);
    } catch (e) {
            res.status(400).send({Error: "Couldn't Update Task :("});
    }
});

// Delete a Task
router.delete('/tasks/:id', auth, async(req, res) => {
    try {
        const task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id});
        
        if (!task) {
            return res.status(404).send();
        }

        res.send(task);
    } catch (e) {
            res.status(500).send(e);
    }
});      

module.exports = router;