var mongoose = require('mongoose');
var moment = require('moment');

var Schema = mongoose.Schema;

var AuthorSchema = new Schema ({
  first_name: { type: String, required: true, max: 100 },
  family_name: { type: String, required: true, max: 100},
  date_of_birth: { type: Date },
  date_of_death: { type: Date }
});

// Virtual for author's full name
AuthorSchema
.virtual('name')
.get(function () {
  return this.family_name + ', ' + this.first_name;
});

// Virtual for formatted date of birth
AuthorSchema
.virtual('date_of_birth_formatted')
.get(function () {
  return this.date_of_birth ? moment(this.date_of_birth).format('YYYY-MM-DD') : '';
});

// Virtual for formatted date of death
AuthorSchema
.virtual('date_of_death_formatted')
.get(function () {
  return this.date_of_death ? moment(this.date_of_death).format('YYYY-MM-DD') : '';
});

// Virtual for author's lifespan
AuthorSchema
.virtual('lifespan')
.get(function () {
  return (this.date_of_birth ? moment(this.date_of_birth).format('MMMM Do, YYYY') : '') + ' - ' +
         (this.date_of_death ? moment(this.date_of_death).format('MMMM Do, YYYY') : '');
});

// Virtual for author's age
AuthorSchema
.virtual('age')
.get(function () {
  var exist_date_b = (this.date_of_birth != null);
  var exist_date_d = (this.date_of_death != null);

  // var month receive -1 because the parameters on .diff() are between 0..11
  if (exist_date_b) {
    //var day_b = moment(this.date_of_birth).format('DD');
    var month_b = moment(this.date_of_birth).format('MM') - 1;
    var year_b  = moment(this.date_of_birth).format('YYYY');
    // Actual date
    var month_d = moment().format('MM') - 1;
    var year_d  = moment().format('YYYY');
    if (exist_date_d) {
      month_d = moment(this.date_of_death).format('MM') - 1;
      year_d  = moment(this.date_of_death).format('YYYY');
    }

    // Define dates to calc years
    var birth = moment([year_b, month_b]);
    var death = moment([year_d, month_d]);
    return (death.diff(birth, "years"));    
  } else {
    return '0';
  }
});

// Virtual for author's URL
AuthorSchema
.virtual('url')
.get(function () {
  return '/catalog/author/' + this._id;
});

// Export model
module.exports = mongoose.model('Author', AuthorSchema);