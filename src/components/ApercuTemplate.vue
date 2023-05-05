<template>
  <q-card>
    <div :class="'column q-px-sm ' + dkli(idx)">

    </div>

    <!-- Dialogue d'édition -->
    <q-dialog v-model="edit" persistent>
      <q-card class="bs moyennelargeur">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense flat size="md" icon="close" @click="MD.fD"/>
          <q-toolbar-title class="titre-lg full-width text-center">{{$t('CHtxt')}}</q-toolbar-title>
        </q-toolbar>

      </q-card>
    </q-dialog>
  </q-card>
</template>
<script>

import { toRef, ref, watch } from 'vue'

import stores from '../stores/stores.mjs'
import { MD } from '../app/modele.mjs'

export default {
  name: 'ApercuTemplate',

  props: { },

  components: {  },

  computed: { },

  data () { return {
  }},

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
  },

  setup (props) {
    const session = stores.session
    const aSt = stores.avatar

    function getC () { return aSt.getChat(naI.value.id, ids.value) }

    const chat = ref(getC())

    aSt.$onAction(({ name, args, after }) => {
      after((result) => {
        if ((name === 'setChat' && args[0].id === naI.value.id && args[0].ids === ids.value) ||
          (name === 'delChat' && args[0] === naI.value.id && args[1] === ids.value)){
          chat.value = getC()
        }
      })
    })

    /* Nécessaire pour tracker le changement d'id
    Dans une liste le composant N'EST PAS rechargé quand la liste change */
    watch(() => naI.value, (ap, av) => {
        chat.value = getC()
      }
    )

    /* Nécessaire pour tracker le changement d'id
    Dans une liste le composant N'EST PAS rechargé quand la liste change */
    watch(() => naE.value, (ap, av) => {
        chat.value = getC()
      }
    )

    /* Nécessaire pour tracker le changement d'ids
    Dans une liste le composant N'EST PAS rechargé quand la liste change */
    watch(() => ids.value, (ap, av) => {
        chat.value = getC()
      }
    )

    const edit = ref(false)
    function ovedit () { MD.oD(edit) }

    return {
      MD, edit, ovedit,
      session,
      chat
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
