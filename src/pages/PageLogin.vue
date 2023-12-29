<template>
<q-page class="column align-start items-center">

  <div class="font-mono fs-sm self-end text-italic q-ma-xs">{{config.BUILD}}</div>

  <q-expansion-item class="q-mt-xl spsm" group="g1" default-opened>
    <template v-slot:header>
      <div class="full-width titre-lg row justify-between bord1">
        <div>{{$t('LOGconn2')}}</div>
        <bouton-help page="page1" class="col-auto"/>
      </div>
    </template>
    <div class="row justify-center q-gutter-sm q-mt-sm q-mr-xl">
      <q-btn class="titre-lg" icon="autorenew" 
        dense padding="xs" size="md" no-caps color="primary" right-icon="send"
        :label="$t('sync')" @click="ouvrirPS(1)"/>
      <q-btn class="titre-lg" 
        dense padding="xs"  size="md" no-caps color="primary" right-icon="send"
        @click="ouvrirPS(2)">
        <div class="row items-center q-gutter-sm">
          <q-icon size="sm"><img src="~assets/incognito_blanc.svg"/></q-icon>
          <div>{{$t('incognito')}}</div>
        </div>
      </q-btn>
      <q-btn class="titre-lg" icon="airplanemode_active" 
        dense padding="xs" size="md" no-caps color="primary"  right-icon="send"
        :label="$t('avion')" @click="ouvrirPS(3)"/>
    </div>
  </q-expansion-item>

  <q-expansion-item class="q-mt-xl spsm" group="g1">
    <template v-slot:header>
      <div class="full-width titre-lg row justify-between bord1">
        <div>{{$t('LOGconn3')}}</div>
        <bouton-help page="page1" class="col-auto"/>
      </div>
    </template>

    <div class="q-px-sm">
      <div class="titre-md q-my-md">{{$t('LOGpar')}}</div>
      <div class="col q-py-sm q-gutter-md row justify-center">
        <q-radio dense v-model="locmode" :val="1" :label="$t('sync')" />
        <q-radio dense v-model="locmode" :val="2" :label="$t('incognito')" />
      </div>
      <phrase-contact :class="(!locmode ? 'disabled' : '') + ' full-width'" @ok="crypterphrase"/>
    </div>
  </q-expansion-item>

  <!-- Dialogue d'acceptation d'un nouveau sponsoring -->
  <acceptation-sponsoring v-if="ui.d.ASaccsp" :sp="sp" :pc="pc" :org="org"/>

</q-page>
</template>

<script>
import { ref, watch } from 'vue'

import stores from '../stores/stores.mjs'

import { afficherDiag } from '../app/util.mjs'
import { connecterCompte, GetEstFs } from '../app/connexion.mjs'
import { Sponsoring, resetRepertoire } from '../app/modele.mjs'
import { ChercherSponsoring } from '../app/operations.mjs'
import { AMJ, ID, isAppExc } from '../app/api.mjs'
import PhraseContact from '../components/PhraseContact.vue'
import AcceptationSponsoring from '../panels/AcceptationSponsoring.vue'
import BoutonHelp from '../components/BoutonHelp.vue'

export default {
  name: 'PageLogin',

  components: { PhraseContact, AcceptationSponsoring, BoutonHelp },

  data () {
    return {
      btncd: false,
      sp: null,
      pc: null,
      org: ''
    }
  },

  watch: {
  },

  methods: {
    ouvrirPS (mode) {
      this.session.setMode(mode)
      this.ui.ps = { 
        login: true, 
        labelValider: "LOGconn", 
        iconValider: "send",
        ok: this.onps
        }
      this.ui.oD('PSouvrir')
    },
    reset () {  },
    async setFs () {
      const ret = await new GetEstFs().run()
      if (isAppExc(ret)) { this.raz(); return false } else return true
    },
    async onps (phrase) {
      if (phrase) phrase.phrase = null
      if (!await this.setFs()) return
      connecterCompte(phrase, this.ui.razdb)
    },
    async crypterphrase (pc) {
      this.pc = pc
      this.org = pc.org
      if (!await this.setFs()) return
      try {
        /* Recherche sponsoring ******
        args.ids : hash de la phrase de contact
        Retour:
        - rowSponsoring s'il existe
        */
        resetRepertoire()
        stores.reset(true)
        const res = await new ChercherSponsoring().run(this.pc.phch)
        if (isAppExc(res) || !res || !res.rowSponsoring) {
          await afficherDiag(this.$t('LOGnopp'))
          this.raz()
          return
        }
        try {
          const sp = res.rowSponsoring
          const session = stores.session
          session.setNs(ID.ns(sp.id))
          this.sp = await Sponsoring.fromRow(sp, this.pc.clex)
          if (isAppExc(this.sp) || this.sp.dlv <  AMJ.amjUtc()) {
            await afficherDiag(this.$t('LOGppinv'))
            this.raz()
            return                  
          }
          if (this.sp.st !== 0) {
            await afficherDiag(this.$t('LOGsp' + this.sp.st))
            this.raz()
            return                  
          }
          this.ui.oD('ASaccsp')
          return
        } catch (e) {
          await afficherDiag(this.$t('LOGppatt'))
          this.raz()
          return         
        }
      } catch (e) {
        console.log(e)
        this.raz()
        return
      }
    },
    raz () {
      this.btncd = false
      this.pc = null
      this.sp = null
      this.org = ''
    }
  },

  setup () {
    const config = stores.config
    const session = stores.session
    const ui = stores.ui
    const locmode = ref(session.mode)

    /*
    watch(razdb, async (ap, av) => {
      if (ap === true && ap !== av) {
        await afficherDiag($t('LOGrazbl'))
        console.log('Raz db diag')
      }
    })
    */

    watch(locmode, (ap, av) => {
      if (ap !== session.mode) {
        session.setMode(ap)
      }
    })

    return {
      session, ui,
      config,
      locmode
    }
  }
}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord1
  border-bottom: 1px solid $orange
.disabled
  pointer-events: none
  opacity: 0.4
</style>
