<template>
    <q-card v-if="ui.exc" class="q-ma-xs moyennelargeur">
      <q-card-section>
        <div class="titre-lg">{{$t('EX' + exc.majeur)}}</div>
      </q-card-section>
      <q-card-section>
        <div class="titre-md" v-html="html"/>
      </q-card-section>
      <q-card-actions align="center">
        <q-btn flat dense color="negative" :label="$t('ERdec')" @click="deconnecter"/>
        <q-btn v-if="rec" flat dense color="warning" :label="$t('ERrec')" @click="reconnecter"/>
        <q-btn v-if="cont" flat dense color="primary" :label="$t('ERcont')" @click="continuer"/>
        <q-btn v-if="mod" flat dense color="primary" :label="$t('ERmod')" @click="continuer"/>
      </q-card-actions>
      <q-card-section class="q-pt-none">
        <div v-if="exc.stack">
          Stack <q-toggle v-model="errstack"/>
          <q-input v-if="errstack" type="textarea" autogrow v-model="ui.exc.stack" class="q-pa-xs stackclass font-mono"/>
        </div>
      </q-card-section>
    </q-card>
</template>

<script>
import stores from '../stores/stores.mjs'

import { deconnexion } from '../app/modele.mjs'
import { reconnexion } from '../app/connexion.mjs'
import { html } from '../app/util.mjs'

const lcont = new Set([1, 4, 6, 7])
const lmod = new Set([5, 8])

export default ({
  name: 'DialogueErreur',

  computed: {
    html () { return html(this.exc) },
    exc () {
      return this.ui.exc || { code: 0, majeur : 0 }
    },
    rec () {
      const s = this.session
      return !this.exc.sync && s.status > 1 && s.phrase
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
    deconnecter () {
      this.ui.resetExc()
      deconnexion(2)
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
