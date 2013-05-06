$(document).ready(function(){
  var colonyModel = {}
  colonyControllerView.init($('.colony-form'), cellCollection);
  colonyView.init($('.colony'), cellCollection);
});

var colonyControllerView = {
  init: function(el, cellCollection) {
    this.$el = $(el);
    this.collection = cellCollection;
    this.listen();
  },

  listen: function() {
    this.$el.find('.setup').on('click', this.setup.bind(this));
    this.$el.find('.grow').on('click', this.grow.bind(this));
    this.$el.find('.pause').on('click', this.pause.bind(this));
    this.$el.find('.reset').on('click', this.reset.bind(this));
    $(this.collection).on('empty', this.reset.bind(this));
  },

  setup: function() {
    this.collection.width  = parseInt(this.$el.find('.width').val());
    this.collection.height = parseInt(this.$el.find('.height').val());
    this.collection.init();
    this.clear();
    this.$el.find('.grow').show();
  },

  grow: function() {
    this.$el.find('.setup, .grow').hide();
    this.$el.find('.reset, .pause').show();
    this.collection.grow();
  },

  pause: function() {
    this.$el.find('.pause').hide();
    this.$el.find('.grow').show();
    this.collection.pause();
  },

  reset: function() {
    this.$el.find('.setup, .grow').show();
    this.$el.find('.reset, .pause').hide();
    this.collection.init();
  },

  clear: function() {
    this.$el.find('.width').val('');
    this.$el.find('.height').val('');
  }
}

var colonyView = {
  init: function(el, collection) {
    this.$el = $(el);
    this.collection  = collection;
    this.listen();
  },

  listen: function() {
    this.$el.on('click', 'td', this.updateCell.bind(this));
    $(this.collection).on('change', this.renderColony.bind(this));
    $(this.collection).on('toggledCell', this.activateCell.bind(this));
  },

  updateCell: function(e) {
    this.collection.toggleCell($(e.target).data('col'), $(e.target).data('row'))
  },

  renderColony: function() {
    this.clear();
    for(var i=0, ii=this.collection.height; i<ii; i++) {
      var row = '<tr data-id="' + i + '"></tr>';
      for(var j=0, jj=this.collection.width; j<jj; j++) {
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
  init: function() {
    this.cells        = [];
    this.heightRange  = [];
    this.widthRange   = [];
    for (var i=0, ii=this.height; i<ii; i++) { this.heightRange.push(i); }
    for (var i=0, ii=this.width; i<ii; i++) { this.widthRange.push(i); }
    this.load();
    $(this).trigger('change');
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

  grow: function() {
    if(this.isEmpty()) { 
      this.pause();
      $(this).trigger('empty');
    } else {
      this.updateNextGen();
      this.growCells();
      $(this).trigger('change');
      this.currentGen = setTimeout(this.grow.bind(this), 150); 
    }
  },

  pause: function() {
    clearTimeout(this.currentGen);
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
    return row; 
  },

  leftOrRight: function(col) {
    if (col === this.width) return 0
    if (col < 0) return this.width - 1
    return col; 
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
