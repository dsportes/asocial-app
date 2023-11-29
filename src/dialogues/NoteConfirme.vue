<template>
<q-card class="bs sp40" style="padding:0">
  <q-toolbar class="bg-secondary text-white">
    <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
    <q-toolbar-title class="titre-lg full-width text-center">
      {{$t('NCF' + op)}}
    </q-toolbar-title>
    <bouton-help :page="'CF' + op"/>
  </q-toolbar>

  <div v-if="session.editDiag" class="q-ma-sm q-pa-xs text-center text-bold titre-md bg-yellow-5 text-warning">
    {{session.editDiag}}
  </div>

  <div v-if="msg" class="q-ma-sm" >
    <div class="q-my-sm q-pa-xs text-bold titre-md bg-yellow-5 text-warning">{{$t('NCFm0')}}</div>
    <div class="q-ml-sm titre-md">{{msg}}</div>
  </div>

  <div class="q-my-md row justify-center items-center q-gutter-md">
    <q-btn class="q-pa-xs btn" size="md" dense :label="$t('renoncer')" color="primary" @click="MD.fD"/>
    <bouton-confirm v-if="!session.dialog && !msg" actif :confirmer="noteopx"/>
  </div>

</q-card>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import { $t } from '../app/util.mjs'
import BoutonConfirm from '../components/BoutonConfirm.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import { MD } from '../app/modele.mjs'
import { NoteOpx } from '../app/operations.mjs'

export default {
  name: 'NoteConfirme',

  components: { BoutonConfirm, BoutonHelp},

  props: { 
    op: String // suppr arch react
  },

  computed: { },

  methods: { 
    async noteopx () {
      MD.fD()
      await new NoteOpx().run(this.op)
    }
  },

  data () {
    return {
    }
  },

  setup () {
    const session = stores.session
    const aSt = stores.avatar
    const nSt = stores.note
    const msg = ref('')

    /* Conditions requises si la note est une note de groupe
    - avoir un avatar du compte auteur
    - si la note A une exclusité pour l'avatar im,
      - soit im est avatar du compte,
      - soit un avatar du compte est animateur du groupe.
    */
    if (nSt.estGr) {
      const s = nSt.egr.groupe.avcAuteurs()
      if (!s.size) { 
        msg.value = $t('NCFm1')
      } else {
        // retourne { avc: true/false, nom } ou null s'il n'y a pas d'exclusivité
        const xav = nSt.mbExclu
        if (xav) {
          if (!xav.avc && !nSt.egr.estAnim) 
            msg.value = $t('NCFm2', [xav.nom])
        }
      }
    }

    return {
      session, aSt, nSt, MD, msg
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.btn
  max-height: 1.5rem
</style>
