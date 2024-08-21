<template>
  <q-dialog v-model="ui.d.dialogueerreur" persistent>
    <q-card v-if="ui.exc" :class="styp('sm')">
      <q-card-section>
        <div v-if="special" class="titre-lg" v-html="html"/>
        <div v-else class="titre-lg">{{$t('EX' + exc.majeur)}}</div>
      </q-card-section>
      <q-card-section v-if="!special"> <!-- Libellé détaillé de l'erreur -->
        <div class="titre-md" v-html="html"/>
      </q-card-section>
      <q-card-actions vertical align="stretch" class="q-gutter-sm">
        <btn-cond v-if="session.status" color="warning" icon="logout" 
          :label="$t('ERdec')" @ok="deconnecter"/>
        <btn-cond v-if="fige" icon="notifications"
          :label="$t('ERfige')" @ok="reconnecter"/>
        <btn-cond v-if="fige && cont" icon="notifications"
          :label="$t('ERfige')" @ok="continuer"/>
        <btn-cond v-if="rec" color="warning" icon="refresh" 
          :label="$t('ERrec')" @ok="reconnecter"/>
        <btn-cond v-if="!fige && cont" icon="arrow_forward" 
          :label="$t('ERcont')" @ok="continuer"/>
        <btn-cond v-if="!fige && rlog" icon="arrow_forward" 
          :label="$t('ERrlog')" @ok="continuer"/>
        <btn-cond v-if="!fige && mod" icon="arrow_forward" 
          :label="$t('ERmod')" @ok="continuer"/>
      </q-card-actions>
      <q-card-section class="q-pt-none">
        <div v-if="exc.stack">
          Stack <q-toggle v-model="errstack"/>
          <q-input v-if="errstack" type="textarea" autogrow v-model="ui.exc.stack" class="q-pa-xs stackclass font-mono"/>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import stores from '../stores/stores.mjs'

import { reconnexion, deconnexion } from '../app/synchro.mjs'
import { styp, html } from '../app/util.mjs'
import BtnCond from '../components/BtnCond.vue'

const lcont = new Set([1, 4, 6, 7])
const lmod = new Set([5, 8])
const speciaux = new Set([8998, 8999, 1000])

export default ({
  name: 'DialogueErreur',

  components: { BtnCond },

  computed: {
    /*
    ERdec: 'Se déconnecter',
    ERfige: 'Voir les notifications',
    ERrec: 'Tenter de se reconnecter',
    ERcont: 'Poursuivre la session quand-même',
    ERmod: 'Continuer pour modifier les données',
    ERrlog: 'Reprendre la procédure de connexion',
    */
    special () { return speciaux.has(this.exc.code) },
    html () { return html(this.exc) },
    exc () { return this.ui.exc || { code: 0, majeur : 0 } },
    rlog () { return !this.session.status },
    fige () { return this.exc.code === 8101 },
    rec () { return this.session.status > 1 },
    cont () { return  this.session.status > 1 && lcont.has(this.exc.majeur) },
    mod () { return this.session.status > 1 && lmod.has(this.exc.majeur) }
  },

  data () {
    return {
      errstack: false
    }
  },

  methods: {
    async notif () { this.ui.setPage('compta', 'notif')},
    async deconnecter () {
      this.ui.resetExc()
      await deconnexion(true)
    },
    async reconnecter () {
      this.ui.resetExc()
      await reconnexion()
    },
    continuer () {
      const resolve = this.ui.dialogueerreurresolve
      this.ui.resetExc()
      if (resolve) resolve()
    }
  },

  setup () {
    return {
      ui:  stores.ui,
      session: stores.session,
      styp
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.stackclass
  height: 15rem
  border: 1px solid black
  font-size: 0.8rem
</style>
