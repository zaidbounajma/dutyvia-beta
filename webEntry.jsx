import { AppRegistry } from 'react-native'
import App from './App'

// Nom arbitraire du composant "app"
const APP_NAME = 'DutyFreeWeb'

AppRegistry.registerComponent(APP_NAME, () => App)

// Monte l'app dans #root
AppRegistry.runApplication(APP_NAME, {
  rootTag: document.getElementById('root')
})
