$(document).ready(function(){
  var colonyModel = {}
  colonyFormView.init($('.colony-form'), colonyModel);
  colonyView.init($('.colony'), colonyModel, cellCollection);
});

var colonyFormView = {
  init: function(el, colonyModel) {
    this.$el = $(el);
    this.model = colonyModel
    this.listen();
  },

  listen: function() {
    this.$el.find('.setup').on('click', this.setup.bind(this));
    this.$el.find('.grow').on('click', this.grow.bind(this));
    this.$el.find('.pause').on('click', this.pause.bind(this));
    this.$el.find('.reset').on('click', this.reset.bind(this));
    $(this.model).on('empty', this.reset.bind(this));
  },

  setup: function() {
    this.model.width  = parseInt(this.$el.find('.width').val());
    this.model.height = parseInt(this.$el.find('.height').val());
    $(this.model).trigger('setup');
    this.$el.find('.grow').show();
  },

  grow: function() {
    this.$el.find('.setup, .grow').hide();
    this.$el.find('.reset, .pause').show();
    $(this.model).trigger('grow');
  },

  pause: function() {
    this.$el.find('.pause').hide();
    this.$el.find('.grow').show();
    $(this.model).trigger('pause');
  },

  reset: function() {
    this.$el.find('.setup, .grow').show();
    this.$el.find('.reset, .pause').hide();
    $(this.model).trigger('reset');
  }
}

var colonyView = {
  init: function(el, colonyModel, collection) {
    this.$el = $(el);
    this.colonyModel = colonyModel;
    this.collection = collection;
    this.listen();
  },

  listen: function() {
    this.$el.on('click', 'td', this.updateCell.bind(this));
    $(this.colonyModel).on('setup', this.setup.bind(this));
    $(this.colonyModel).on('grow', this.grow.bind(this));
    $(this.colonyModel).on('pause', this.pause.bind(this));
    $(this.colonyModel).on('reset', this.reset.bind(this));
    $(this.collection).on('toggledCell', this.activateCell.bind(this));
    $(this.collection).on('aged', this.renderColony.bind(this));
    $(this.collection).on('empty', this.empty.bind(this));
  },

  setup: function() {
    this.collection.init(this.colonyModel);
    this.renderColony();
  },

  grow: function() {
    this.currentGen = setInterval(this.collection.grow.bind(this.collection), 250);
  },

  pause: function() {
    clearInterval(this.currentGen);
  },

  reset: function() {
    clearInterval(this.currentGen);
    this.$el.find('td').removeClass("alive");
  },

  empty: function() {
    this.reset();
    $(this.colonyModel).trigger("empty");
  },

  updateCell: function(e) {
    this.collection.toggleCell($(e.target).data('col'), $(e.target).data('row'))
  },

  renderColony: function() {
    this.clear();
    for(var i=0, ii=this.colonyModel.height; i<ii; i++) {
      var row = '<tr data-id="' + i + '"></tr>';
      for(var j=0, jj=this.colonyModel.width; j<jj; j++) {
        row = $(row).append(this.renderCell(this.collection.find(j, i)));
      }
      this.$el.append(row);
    }
  },

  renderCell: function(cell) {
    if (cell.currHealth == 1) {
      return '<td class="alive" data-col="' + cell.col + '" data-row="' + cell.row + '"></td>';
    } else {
      return '<td data-col="' + cell.col + '" data-row="' + cell.row + '"></td>';
    }
  },

  activateCell: function(event, cell) {
    $(this.$el.find('td[data-row="' + cell.row + '"]')[cell.col]).toggleClass("alive");
  },

  clear: function() {
    this.$el.children().remove();
  }
}

var cellCollection = {
  init: function(data) {
    this.cells        = [];
    this.heightRange  = [];
    this.widthRange   = [];
    this.width  = data.width;
    this.height = data.height;
    for (var i=0, ii=this.height; i<ii; i++) { this.heightRange.push(i); }
    for (var i=0, ii=this.width; i<ii; i++) { this.widthRange.push(i); }
    this.load();
  },

  load: function() {
    for(var i=0, ii=this.height; i<ii; i++) {
      var row = [];
      for(var j=0, jj=this.width; j<jj; j++) { row.push(new Cell(j, i)); }
      this.cells.push(row);
    }
  },

  find: function(col, row) {
    return this.cells[row][col];
  },

  toggleCell: function(col, row) {
    $(this).trigger('toggledCell', this.find(col, row).toggle());
  },

  grow: function(cb) {
    this.updateNextGen();
    this.growCells();
    $(this).trigger('aged');
    if(this.isEmpty()) $(this).trigger('empty');
  },

  updateNextGen: function() {
    for(var i=0, ii=this.height; i<ii; i++) {
      for(var j=0, jj=this.width; j<jj; j++) { this.updateCell(this.find(j, i)); }
    }
  },

  growCells: function() {
    for(var i=0, ii=this.height; i<ii; i++) {
      for(var j=0, jj=this.width; j<jj; j++) { this.find(j, i).grow(); }
    }
  },

  updateCell: function(cell) {
    if(cell.currHealth === 1 && (this.neighborSum(cell.col, cell.row) < 2 || this.neighborSum(cell.col, cell.row) > 3)) {
      cell.nextHealth = 0;
    } else if (cell.currHealth === 0 && this.neighborSum(cell.col, cell.row) === 3) {
      cell.nextHealth = 1;
    } else {
      cell.nextHealth = cell.currHealth;
    }
  },

  neighborSum: function(col, row) {
    var aliveCount = 0;
    var neighbors = this.fetchNeighbors(col, row);
    for(var i in neighbors) {
      aliveCount += this.find(neighbors[i][0], neighbors[i][1]).currHealth;
    }
    return aliveCount;
  },

  fetchNeighbors: function(col, row) {
    return [
    [this.leftOrRight(col - 1), this.topOrBottom(row - 1)],
    [this.leftOrRight(col), this.topOrBottom(row - 1)],
    [this.leftOrRight(col + 1), this.topOrBottom(row - 1)],
    [this.leftOrRight(col - 1), row],
    [this.leftOrRight(col + 1), row],
    [this.leftOrRight(col - 1), this.topOrBottom(row + 1)],
    [this.leftOrRight(col), this.topOrBottom(row + 1)],
    [this.leftOrRight(col + 1), this.topOrBottom(row + 1)],
    ]
  },

  topOrBottom: function(row) {
    if (row === this.height) return 0
    if (row < 0) return this.height - 1
    return this.heightRange[row]
  },

  leftOrRight: function(col) {
    if (col === this.width) return 0
    if (col < 0) return this.width - 1
    return this.widthRange[col]
  },

  isEmpty: function() {
    for(var i=0, ii=this.height; i<ii; i++) {
      for(var j=0, jj=this.width; j<jj; j++) {
        if(this.find(j, i).currHealth === 1) return false;
      }
    }
    return true;
  }
}

function Cell(col, row) {
  this.col        = col;
  this.row        = row;
  this.currHealth = 0;
  this.nextHealth = null;
}

Cell.prototype.toggle = function() {
  this.currHealth = this.currHealth == 1 ? 0 : 1;
  return this;
}

Cell.prototype.grow = function() {
  this.currHealth = this.nextHealth;
  this.nextHealth = null;
  return this;
}
