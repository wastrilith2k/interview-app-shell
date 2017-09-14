'use strict';
import {observer} from 'mobx-react'; // <-- That's store based magic, for now just think about it as making the following component watch when our state store changes
import {Component} from 'react-dom';
module.exports = observer((props) => {
    const cols = Object.keys(props.Store.columns);
    return (
        <section>
            <header>
                <ul>
                    {Object.keys(props.Store.aggregates).map(k => {
                        return <li>{k}: {props.Store.aggregates[k]}</li>;
                    })}
                </ul>
            </header>
            <div>
                <select value={props.Store.range} onChange={props.Store.filter}>
                    {props.Store.rangeOptions.map(r => <option value={r}>{r}</option>)}
                </select>
            </div>
            <div>
                <table>
                    <thead>
                    {Object.keys(props.Store.columns).map(header => {
                        return <th onClick={() => props.Store.sort(header)}>{props.Store.columns[header].label}</th>;
                    })}                        
                    </thead>
                    <tbody>
                    {props.Store.tableData.map(row => {
                        return <tr>{Object.keys(row)
                            .filter(ckey => cols.indexOf(ckey) >= 0)
                            .map(rkey => <td className={rkey}>{row[rkey]}</td>)
                            }</tr>;
                    })}                         
                    </tbody>
                </table>    
            </div>
        </section>
    )
});