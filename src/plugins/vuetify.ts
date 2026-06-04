import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

export default createVuetify({
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        dark: true,
        colors: {
          background: '#0E1117',
          surface: '#161B22',
          primary: '#4FD1C5',
          secondary: '#7C9EF7',
          info: '#5EB1F5',
          success: '#5EE6A8',
          warning: '#F0B86E',
          error: '#F47B7B',
        },
      },
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
})
