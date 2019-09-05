var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');
const validator = require('express-validator');
var async = require('async');

// Display list of all BookInstances
exports.bookinstance_list = function (req, res) {
  //res.send('NOT IMPLEMENTED: BookInstance list');
  BookInstance.find()
    .populate('book')
    .exec(function (err, list_bookinstance) {
      if (err) { return next(err); }
      // Successfull, so render
      res.render('bookinstance_list', {title: 'Book Instance List', bookinstance_list: list_bookinstance});
    });
};

// Display detail page for a specific BookInstance
exports.bookinstance_detail = function (req, res) {
  //res.send('NOT IMPLEMENTED: BookInstance detail: ' + req.params.id);
  BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
      if (err) { return next(err); }
      if (bookinstance == null) {
        var err = new Error('Book copy not found.');
        err.status = 404;
        return next(err);
      }
      // Successfull, so render
      res.render('bookinstance_detail', { title: 'Copy: ' + bookinstance.book.title, bookinstance: bookinstance });
    });
};

// Display BookInstance create on GET
exports.bookinstance_create_get = function (req, res, next) {
  //res.send('NOT IMPLEMENTED: BookInstance create GET');
  Book.find({}, 'title')
      .exec(function (err, books) {
        if (err) { return next(err); }
        // Successful, so render
        res.render('bookinstance_form', {title: 'Create BookInstance', book_list: books});
      });
};

// Handle BookInstance create on POST
exports.bookinstance_create_post = [
  //res.send('NOT IMPLEMENTED: BookInstance create POST');
  // Validate fields
  validator.body('book', 'Book must be specified.').isLength({ min: 1 }).trim(),
  validator.body('imprint', 'Imprint must be specified.').isLength({ min: 1 }).trim(),
  validator.body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),

  // Sanitize fields
  validator.sanitizeBody('book').escape(),
  validator.sanitizeBody('imprint').escape(),
  validator.sanitizeBody('status').trim().escape(),
  validator.sanitizeBody('due_back').toDate(),

  // Process request after validation and sanitization
  (req, res, next) => {
    // Extract the validation errors from a request
    const errors = validator.validationResult(req);

    // Create a BookInstance object with escaped and trimmed data
    var bookinstance = new BookInstance ({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values and error messages.
      Book.find({}, 'title')
          .exec(function (err, books) {
            if (err) { return next(err); }
            // Successful, so render
            res.render('bookinstance_form', {title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance});
          });
      return;
    } else {
      // Data from form is valid
      bookinstance.save(function (err) {
        if (err) { return next(err); }
        // Successful - redirect to new record
        res.redirect(bookinstance.url);
      });
    }
  }
];

// Display BookInstance delete form on GET
exports.bookinstance_delete_get = function (req, res, next) {
  //res.send('NOT IMPLEMENTED: BookInstance delete GET');
  async.parallel({
    bookinstance: function (callback) {
      BookInstance.findById(req.params.id)
                  .populate('book')
                  .exec(callback);
    },
  },
  function (err, results) {
    if (err) { return next(err); }
    if (results.bookinstance == null) {
      res.redirect('/catalog/bookinstances');
    }
    res.render('bookinstance_delete', {title: 'BookInstance Delete', bookinstance: results.bookinstance});
  });
};

// Handle BookInstance delete form on POST
exports.bookinstance_delete_post = function (req, res, next) {
  //res.send('NOT IMPLEMENTED: BookInstance delete POST');
  async.parallel({
    bookinstance: function (callback) {
      BookInstance.findById(req.body.bookinstanceid)
                  .exec(callback);
    },
  },
  function (err, results) {
    if (err) { return next(err); }
    BookInstance.findByIdAndDelete(req.body.bookinstanceid, function deleteBookInstance(err) {
      if (err) { return next(err); }
      // Success, go to bookinstance list
      res.redirect('/catalog/bookinstances');
    });
  });
};

// Display BookInstance update form on GET
exports.bookinstance_update_get = function (req, res, next) {
  //res.send('NOT IMPLEMENTED: BookInstance update GET');
  async.parallel({
    bookinstance: function (callback) {
      BookInstance
        .findById(req.params.id)
        .populate('book')            
        .exec(callback);
    },
    book_list: function (callback) {
      Book.find({}, 'title').exec(callback);
    },
  },
  function (err, results) {
    if (err) { return next(err); }
    res.render('bookinstance_form', {title: 'Update BookInstance', bookinstance: results.bookinstance, book_list: results.book_list});
  });
};

// Handle BookInstance update form on POST
exports.bookinstance_update_post = [
  //res.send('NOT IMPLEMENTED: BookInstance update POST');
  // Validate fields
  validator.body('book', 'Book must be specified.').isLength({ min: 1 }).trim(),
  validator.body('imprint', 'Imprint must be specified.').isLength({ min: 1 }).trim(),
  validator.body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),

  // Sanitize fields
  validator.sanitizeBody('book').escape(),
  validator.sanitizeBody('imprint').escape(),
  validator.sanitizeBody('status').trim().escape(),
  validator.sanitizeBody('due_back').toDate(),
  
  (req, res, next) => {
    const errors = validator.validationResult(req);

    var bookinstance = new BookInstance({
      status: req.body.status,
      book: req.body.book,
      imprint: req.body.imprint,
      due_back: req.body.due_back,
      _id: req.params.id
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages
      // Get all authors and genres for form      
      Book.find({}, 'title')
          .exec(function (err, book_list) {
            if (err) { return next(err); }
            // Success
            res.render('bookinstance_form', {title: 'Update BookInstance', book_list: book_list, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance});
          });   
      return;
    } else {
      // Data from form is valid
      BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function (err, thebookinstance) {
        if (err) { return next(err); }
        // Success
        res.redirect(thebookinstance.url);
      });
    }
  }
];