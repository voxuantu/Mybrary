const express = require('express')
const router = express.Router()
const Author = require('../models/authors')

// All authors route
router.get('/',async (req,res) => {
    let searchOption = {}
    if(req.query.name != null && req.query.name != ''){
        searchOption.name = new RegExp(req.query.name, 'i')
    }
    try {
        const authors = await Author.find(searchOption)
        res.render('authors/index',{
            authors : authors, 
            searchOption: req.query
        })
    } catch (error) {
        res.redirect('/')
    }
})

// New authors route
router.get('/new',(req,res) => {
    res.render('authors/new', {author : new Author()})
})

// Create authors route
router.post('/',async (req,res) => {
    const author = new Author({
        name : req.body.name
    })
    try {
        const newAuthor = await author.save()
        res.redirect('authors')
    } catch (error) {
        res.render('authors/new', {
            author : author,
            errMessage : 'Error creating Author'
       })
    }
})

module.exports = router