'use strict';
import {observer} from 'mobx-react'; // <-- That's store based magic, for now just think about it as making the following component watch when our state store changes
import AppStore from '../stores/AppStore';
import AppBody from './AppBody';

module.exports = observer(() => { 
    AppStore.populate();
    return (
        <main>
            <header>
                <h1>{AppStore.title}</h1>
            </header>
            <AppBody Store={AppStore} />
        </main>
    )
});
