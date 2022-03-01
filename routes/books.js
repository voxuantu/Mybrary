const express = require('express')
const router = express.Router()
const Book = require('../models/book')
const Author = require('../models/authors')
const imageMineTypes = ['image/jpeg','image/png', 'image/gif']

// All book route
router.get('/',async (req,res) => {
    let query = Book.find()
    if(req.query.title != null && req.query.title != ''){
        query = query.regex('title', new RegExp(req.query.title, 'i'))
    }
    if(req.query.publishedBefore != null && req.query.publishedBefore != ''){
        query = query.lte('publishDate', req.query.publishedBefore)
    }
    if(req.query.publishedAfter != null && req.query.publishedAfter != ''){
        query = query.gte('publishDate', req.query.publishedAfter)
    }
    try {
        const books = await query.exec()
        res.render('books/index',{
            books: books,
            searchOption: req.query
        })
    } catch (error) {
        console.log(error)
        res.redirect('/')
    }
})

// New book route
router.get('/new', async (req,res) => {
    renderNewPage(res, new Book())
})

// Create book route
router.post('/', async (req,res) => {
    const fileName = req.file != null ? req.file.filename : null
    const book = new Book({
        title : req.body.title,
        author: req.body.author,
        publishDate: new Date(req.body.publishDate),
        pageCount: req.body.pageCount,
        description: req.body.description
    }) 
    saveCover(book, req.body.cover)

    try {
        const newBook = await book.save();
        res.redirect(`books/${book.id}`)
    } catch (error) {
        renderNewPage(res, book, true)
    }
})

// Show Book route
router.get('/:id', async (req,res) => {
    try {
        const book = await Book.findById(req.params.id).populate('author').exec()
        res.render('books/show',{ book : book })
    } catch (error) {
        res.redirect('/')
    }
})

router.get('/:id/edit', async (req,res) => {
    try {
        const book = await Book.findById(req.params.id)
        renderEditPage(res, book)
    } catch (error) {
        res.redirect('/')
    }
})

async function renderFormPage(res, book, form, hasError = false ){
    try {
        const authors = await Author.find({})
        const params = {
            authors : authors,
            book : book
        }
        if(hasError){
            if(form === 'edit'){
                params.errMessage = 'Error Updating Book'
            }else{
                params.errMessage = 'Error Creating Book'
            }
        }
        res.render(`books/${form}`, params)
    } catch (error) {
        res.redirect('/books')
    }
}

// Update Book route
router.put('/:id', async (req,res) => {
    let book
    try {
        book = await Book.findById(req.params.id),
        book.title = req.body.title,
        book.author = req.body.author,
        book.publishDate = new Date(req.body.publishDate),
        book.pageCount = req.body.pageCount,
        book.description = req.body.description

        if(req.body.cover != null && req.body.cover != ''){
            saveCover(book, req.body.cover)
        }
        await book.save()
        res.redirect(`/books/${book.id}`)
    } catch (error) {
        if(book != null){
            console.log(error)
            renderEditPage(res, book, true)
        }else{
            res.redirect('/')
        }
    }
})

router.delete('/:id', async (req,res) =>{
    let book
    try {
        book = await Book.findById(req.params.id)
        await book.remove()
        res.redirect('/books')
    } catch (error) {
        if( book != null ){
            res.render('/books/show',{
                book: book,
                errMessage: 'Could not delete book'
            })
        }else{
            res.redirect('/')
        }
    }
})

async function renderEditPage(res, book, hasError = false ){
    renderFormPage(res,book,'edit', hasError)
}



async function renderNewPage(res, book, hasError = false){
   renderFormPage(res,book,'new',hasError)
}

function saveCover(book, coverEncoded){
    if(coverEncoded == null) return
    const cover = JSON.parse(coverEncoded)
    if(cover !=null && imageMineTypes.includes(cover.type)){
        book.coverImage = new Buffer.from(cover.data, 'base64')
        book.coverImageType = cover.type
    }
}

module.exports = router