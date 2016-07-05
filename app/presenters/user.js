var Presenter = require('./presenter');
class User extends Presenter {
  constructor(response) {
    super(response);
    this.userId = this._item.userId;
    this.name = this._item.name;
  }
}

module.exports = User;
