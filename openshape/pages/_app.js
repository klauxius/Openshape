import '../styles/globals.css'
import { UnitProvider } from '../contexts/UnitContext'

function MyApp({ Component, pageProps }) {
  return (
    <UnitProvider>
      <Component {...pageProps} />
    </UnitProvider>
  )
}

export default MyApp 