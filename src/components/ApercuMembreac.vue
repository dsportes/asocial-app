<template>
  <q-card>
    <div :class="'column q-px-sm ' + dkli(idx)">

    </div>

    <!-- Dialogue d'édition -->
    <q-dialog v-model="editX" persistent>
      <q-card class="moyennelargeur shadow-8">
        <q-toolbar class="bg-secondary text-white">
          <q-toolbar-title class="titre-lg full-width">{{$t('CHtxt')}}</q-toolbar-title>
          <q-btn dense flat size="md" icon="close" @click="editX=false"/>
        </q-toolbar>

      </q-card>
    </q-dialog>
  </q-card>
</template>
<script>

// import { toRef, ref, watch } from 'vue'

import stores from '../stores/stores.mjs'

export default {
  name: 'ApercuMembreac',

  props: { mb: Object, idx: Number, edit: Function },

  components: {  },

  computed: { },

  data () { return {
  }},

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
  },

  setup (props) {
    const session = stores.session
    const gSt = stores.groupe

    /*
    const idg = toRef(props, 'idg')
    const im = toRef(props, 'im')

    function getM () { return gSt.getMbac(idg.value, im.value) }

    const mb = ref(getM())

    gSt.$onAction(({ name, args, after }) => {
      after((result) => {
        if ((name === 'setMembre' && args[0].id === idg.value && args[0].ids === im.value) ||
          (name === 'delMembre' && args[0] === idg.value && args[1] === im.value)){
          mb.value = getM()
        }
      })
    })

    // Nécessaire pour tracker le changement d'id
    // Dans une liste le composant N'EST PAS rechargé quand la liste change
    watch(() => idg.value, (ap, av) => {
          mb.value = getM()
      }
    )

    // Nécessaire pour tracker le changement d'id
    // Dans une liste le composant N'EST PAS rechargé quand la liste change
    watch(() => im.value, (ap, av) => {
          mb.value = getM()
      }
    )
    */

    return {
      session,
      gSt
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border-top: 1px solid $grey-5
.bordb
  border-bottom: 1px solid $grey-5
.nom
  max-height: 1.3rem
  overflow: hidden
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
.btn1
  padding: 0 !important
  width: 1.5rem !important
</style>
