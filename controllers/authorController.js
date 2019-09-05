var Author = require('../models/author');
var Book = require('../models/book');
var async = require('async');
var validator = require('express-validator');

// Display list of all authors
exports.author_list = function (req, res) {
  //res.send('NOT IMPLEMENTED: Author list');
  Author.find()
    .sort([['family_name', 'ascending']])
    .exec(function (err, list_authors) {
      if (err) { return next(err); }
      // Successfull, so render
      res.render('author_list', {title: 'Author List', author_list: list_authors});
    });
};

// Display detail page for a specific author
exports.author_detail = function (req, res) {
  //res.send('NOT IMPLEMENTED: Author detail: ' + req.params.id);
  async.parallel({
    author: function (callback) {
      Author.findById(req.params.id)
            .exec(callback);
    },
    author_books: function (callback) {
      Book.find({ 'author': req.params.id }, 'title summary')
          .exec(callback);
    }
  },
  function (err, results) {
    if (err) { return next(err); }
    if (results.author == null) {
      var err = new Error('Author not found');
      err.status = 404;
      return next(err);
    }
    // Successful, so render
    res.render('author_detail', { title: 'Author Detail', author: results.author, author_books: results.author_books});
  });
};

// Display Author create form on GET
exports.author_create_get = function (req, res) {
  //res.send('NOT IMPLEMENTED: Author create GET');
  res.render('author_form', { title: 'Create Author' });
};

// Handle Author create on POST
exports.author_create_post = [
  //res.send('NOT IMPLEMENTED: Author create POST');
  // Validate fields
  validator.body('first_name').isLength({ min: 1 }).trim().withMessage('First name must be specified.')
    .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
  validator.body('family_name').isLength({ min: 1 }).trim().withMessage('Family name must be specified.')
    .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
  validator.body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601(),
  validator.body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601(),

  // Sanitize fields
  validator.sanitizeBody('first_name').escape(),
  validator.sanitizeBody('family_name').escape(),
  validator.sanitizeBody('date_of_birth').toDate(),
  validator.sanitizeBody('date_of_death').toDate(),

  // Process request after validation and sanitization
  (req, res, next) => {
    // Extract the validation errors from a request
    const errors =   validator.validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages
      res.render('author_form', { title: 'Create Author', author: req.body, errors: errors.array() });
      return;
    } else {
      // Data from form is valid
      // Create an Author object with escaped and trimmed data
      var author = new Author({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death
      });

      author.save(function (err) {
        if (err) { return next(err); }
        // Successfull, redirect to new author record
        res.redirect(author.url);
      });
    }
  }
];

// Display Author delete form on GET
exports.author_delete_get = function (req, res, next) {
  //res.send('NOT IMPLEMENTED: Author delete GET');
  async.parallel({
    author: function (callback) {
      Author.findById(req.params.id)
            .exec(callback);
    },
    author_books: function (callback) {
      Book.find({'author': req.params.id})
          .exec(callback);
    }
  },
  function (err, results) {
    if (err) { return next(err); }
    if (results.author==null) { // No results
      res.redirect('/catalog/authors');
    }
    // Successful, so render
    res.render('author_delete', {title: 'Delete Author', author: results.author, author_books: results.author_books});
  });
};

// Handle Author delete on POST
exports.author_delete_post = function (req, res, next) {
  //res.send('NOT IMPLEMENTED: Author delete POST');
  async.parallel({
    author: function (callback) {
      Author.findById(req.body.authorid)
            .exec(callback);
    },
    author_books: function (callback) {
      Book.find({'author': req.params.authorid})
          .exec(callback);
    }
  },
  function (err, results) {
    if (err) { return next(err); }
    // Success
    if (results.author_books.length > 0) {
      // Author has books. Render in same way as for GET route
      res.render('author_delete', {title: 'Delete Author', author: results.author, author_books: results.author_books});
      return;
    } else {
      // Author has no Books. Delete object and redirect to the list of authors
      Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
        if (err) { return next(err); }
        // Success, go to author list
        res.redirect('/catalog/authors');
      });
    }
  });
};

// Display Author update form on GET
exports.author_update_get = function (req, res, next) {
  //res.send('NOT IMPLEMENTED: Author update GET');
  Author.findById(req.params.id, function (err, author) {
    if (err) { return next(err); }

    if (author == null) {
      var err = new Error('Author not found.');
      err.status = 404;
      return next(err);
    }
    res.render('author_form', {title: 'Update Author', author: author});
  });
};

// Handle Author update on POST
exports.author_update_post = [
  //res.send('NOT IMPLEMENTED: Author update POST');
  // Validate fields
  validator.body('first_name').isLength({ min: 1 }).trim().withMessage('First name must be specified.')
    .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
  validator.body('family_name').isLength({ min: 1 }).trim().withMessage('Family name must be specified.'),
  validator.body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601(),
  validator.body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601(),

  // Sanitize fields
  validator.sanitizeBody('first_name').escape(),
  validator.sanitizeBody('family_name').escape(),
  validator.sanitizeBody('date_of_birth').toDate(),
  validator.sanitizeBody('date_of_death').toDate(),

  // Process request after validation and sanitization
  (req, res, next) => {
    const errors = validator.validationResult(req);

    // Create an Author object with escaped/trimmed data and old id

    var author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
      _id: req.params.id
    });

    if (!errors.isEmpty()) {
      // there are errors. Render form again with sanitized values/erros messages
      res.render('author_form', {title: 'Update Author', author: req.body, errors: errors.array()});
      return;
    } else {
      // Data from form is valid. Update Record
      Author.findByIdAndUpdate(req.params.id, author, {}, function (err, theauthor) {
        if (err) { next(err); }
        res.redirect(theauthor.url);
      });
    }
  }
];