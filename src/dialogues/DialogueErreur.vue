<template>
  <q-dialog v-model="ui.d.dialogueerreur" persistent>
    <q-card v-if="ui.exc" :class="sty + ' bs dp30'">
      <q-card-section>
        <div v-if="exc.sync" class="titre-lg">{{$t('ERsync')}}</div>
        <div v-if="exc.code!==8101" class="titre-lg">
          {{$t(exc.code === 1001 ? 'EX1001' : 'EX' + exc.majeur)}}
        </div>
        <div v-else class="titre-lg">{{$t('EX8888')}}</div>
      </q-card-section>
      <q-card-section>
        <div class="titre-md" v-html="html"/>
      </q-card-section>
      <q-card-actions align="center">
        <q-btn v-if="session.status" flat dense color="warning" :label="$t('ERdec')" @click="deconnecter"/>
        <q-btn v-if="fige" flat dense color="warning" :label="$t('ERfige')" @click="gotonotif"/>
        <q-btn v-if="rec" flat dense color="warning" :label="$t('ERrec')" @click="reconnecter"/>
        <q-btn v-if="!fige && cont" flat dense color="primary" :label="$t('ERcont')" @click="continuer"/>
        <q-btn v-if="!fige && rlog" flat dense color="primary" :label="$t('ERrlog')" @click="continuer"/>
        <q-btn v-if="!fige && mod" flat dense color="primary" :label="$t('ERmod')" @click="continuer"/>
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

import { reconnexionCompte, deconnexion } from '../app/connexion.mjs'
import { html } from '../app/util.mjs'

const lcont = new Set([1, 4, 6, 7])
const lmod = new Set([5, 8])

export default ({
  name: 'DialogueErreur',

  computed: {
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    html () { return html(this.exc) },
    exc () {
      return this.ui.exc || { code: 0, majeur : 0 }
    },
    rlog () { return !this.session.status },
    fige () { return this.exc.code === 1001 },
    rec () {
      const s = this.session
      return (!this.exc.sync && s.status > 1 && s.phrase) || this.exc.sync
    },
    cont () {
      const s = this.session
      return !this.exc.sync && s.status > 1 && lcont.has(this.exc.majeur) 
    },
    mod () {
      const s = this.session
      return !this.exc.sync && s.status > 1 && lmod.has(this.exc.majeur) && this.exc.code !== 5001
    }
  },

  data () {
    return {
      errstack: false
    }
  },

  methods: {
    async notif () { this.ui.setPage('compta', 'notif')},
    deconnecter () {
      this.ui.resetExc()
      deconnexion(true)
    },
    async reconnecter () {
      this.ui.resetExc()
      await reconnexionCompte()
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
      session: stores.session
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
