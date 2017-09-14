'use strict';
/*
    Here we've set up a state store for you so all of your time isn't wasted on the endless wasteland of blog posts
    related to why one flux implementation is better than another. In fact, we're not even really using a 100% flux
    type setup here. There's some minor magic going on here, the important thing to know is that we're using a mobx
    based store to implement some reactive programming into our data structure.

    Add new observable properties on to our store object and modify them via store methods like below with exampleKey
    and modifyExample. For more complex views of your observable objects, use a computed property like exampleKeyExtended
    below. Computed properties allow you to observe modified representations of other objects
 */
import {observable} from 'mobx';

class AppStore {

    @observable tableData = [];
    @observable aggregates = {
        'closest': '',
        'fastest': '',
        'largest': ''
    }
    @observable rangeOptions = [1];
    
    title = 'Deep Impact?';
    columns = {
        'date': {
            'label': 'Date',
            'sortable': true,
            'field': 'dVal',
            'type': 'int'
        },
        'name': {
            'label': 'Name',
            'sortable': true,
            'field': 'name',
            'type': 'string'
        },
        'velocity': {
            'label': 'Velocity',
            'sortable': true,
            'field': 'velocity',
            'type': 'float'
        },
        'missDistance': {
            'label': 'Miss Distance',
            'sortable': true,
            'field': 'missDistance',
            'type': 'float'
        },
        'url': {
            'label': 'URL',
            'sortable': false,
            'field': 'url',
            'type': 'string'
        }
    };

    data = [];
    tempData = [];
    range = 0;
    sortKey = 'date';
    sortDirection = 'asc';
    populated = false;
    minDate = 0;
    aDay = 1000 * 3600 * 24;

    populate = function() {
        if (this.populated) return;
        this.initialize();
        fetch('/api/incoming')
            .then(response => {
                if (response.status == 200) {
                    this.populated = true;
                    response.json().then(data => {  
                        let tempData = [];
                        Object.values(data.near_earth_objects).map(dateNode => {
                            dateNode.forEach(neoData => {
                                let name = this.cleanValue(neoData, 'name');
                                let url = this.cleanValue(neoData, 'nasa_jpl_url');
                                let largest = this.cleanValue(neoData, 'estimated_diameter.meters.estimated_diameter_max');
                                neoData.close_approach_data.forEach(cadData => {
                                    tempData.push({
                                        date: this.cleanValue(cadData, 'close_approach_date'),
                                        dVal: this.cleanValue(cadData, 'epoch_date_close_approach'),
                                        name: name,
                                        velocity: this.cleanValue(cadData, 'relative_velocity.kilometers_per_hour'),
                                        missDistance: this.cleanValue(cadData,'miss_distance.kilometers'),
                                        url: url,
                                        closest: this.cleanValue(cadData, 'miss_distance.miles'),
                                        largest: largest
                                    });    
                                });
                            });
                        });
                        this.tempData = this.data = tempData;
                        this.metaData();
                    }); 
                } else {
                    console.log('Fetch Failed. Bad data.')
                }
            })
            .catch(err => {
                console.log('Fetch Failed. Gretchen, stop trying to make fetch happen! It\'s not going to happen!\n' + err)            
            });           
    }

    sort = (sortKey, sortDirection = null) => {
        if (!this.columns[sortKey].sortable) return;
        this.sortKey = sortKey;
        if (sortDirection == null) this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'; 
        if (this.tempData.length === 0) this.tempData = this.tableData;
        let sortField = this.columns[sortKey].field;
        let type = this.columns[sortKey].type;
        this.tempData = this.tempData.sort((a,b) => {
            let aVal = a[sortField];
            let bVal = b[sortField];            
            return (this.sortDirection === 'asc') ? this.sortAsc(aVal, bVal, type) : this.sortDesc(aVal, bVal, type);
        });
        this.commit();
    }

    filter = e => {
        let range = e.target.value;
        if (range != this.range) {
            this.range = range;
            let maxDate = this.minDate + (this.aDay * range);
            this.tempData = this.data.filter(dataNode => {
                return dataNode.dVal < maxDate;
            });
            this.setAggregates();
            this.sort(this.sortKey, this.sortDirection);
        }
    }

    initialize = () => {
        this.data = this.tempData = [];
    }

    metaData = () => {
        this.minDate = Math.min.apply(null, this.tempData.map(d => d.dVal));
        this.range = ((Math.max.apply(null, this.tempData.map(d => d.dVal)) - this.minDate) / this.aDay) + 1;
        let tempRange = [];
        for (var r = 1; r <= this.range; r++) {
            tempRange.push(r);
        }
        this.rangeOptions = tempRange;
        this.setAggregates();
        this.sort(this.sortKey, this.sortDirection);
    }

    setAggregates = () => {
        this.aggregates = {
            'closest': Math.min.apply(null, this.tempData.map(node => node.closest)),
            'fastest': Math.max.apply(null, this.tempData.map(node => node.velocity)),
            'largest': Math.max.apply(null, this.tempData.map(node => node.largest))
        }
    }

    commit = () => {
        this.tableData = this.tempData;
        this.tempData = [];
    }

    cleanValue = (obj, path) => {
        let props = path.split('.');
        for (let prop in props) {
            if (!obj.hasOwnProperty(props[prop])) return false;
            obj = obj[props[prop]];
        }
        return obj;
    }

    sortAsc = (a, b, type) => {
        switch (type) {
            case 'string':
                return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0;  
                break;
            case 'int':
                return parseInt(a) - parseInt(b);
                break;
            case 'float':
                return parseFloat(a) - parseFloat(b);
                break;            
        }
    }

    sortDesc = (a, b, type) => {
        switch (type) {
            case 'string':
                return (a.toUpperCase() > b.toUpperCase()) ? -1 : (a.toUpperCase() < b.toUpperCase()) ? 1 : 0;  
                break;
            case 'int':
                return parseInt(b) - parseInt(a);
                break;
            case 'float':
                return parseFloat(b) - parseFloat(a);
                break;            
        }
    }
}

let store = new AppStore();
module.exports = store;