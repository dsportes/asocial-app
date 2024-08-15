<template>
<q-page class="column align-start items-center">

  <div class="row self-end items-center">
    <div v-if="infx" class="font-mono fs-sm text-italic q-mr-sm">
      {{config.subJSON.substring(0, 70) + '... ' + config.BUILD}}
    </div>
    <q-toggle :class="'q-my-xs bg-' + clrInfx " v-model="infx" color="grey-5" size="25px"/>
  </div>

  <q-expansion-item class="q-mt-xl spsm" group="g1" v-model="ui.loginitem">
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

  <q-expansion-item class="q-mt-xl spsm" v-model="loginitem2">
    <template v-slot:header>
      <div class="full-width titre-lg row justify-between bord1">
        <div>{{$t('LOGconn3')}}</div>
        <bouton-help page="page1" class="col-auto"/>
      </div>
    </template>

    <div class="q-px-sm">
      <div class="titre-md q-my-md">{{$t('LOGpar')}}</div>
      <div class="col q-py-sm q-gutter-md row justify-center">
        <q-radio dense v-model="session.mode" :val="1" :label="$t('sync')" />
        <q-radio dense v-model="session.mode" :val="2" :label="$t('incognito')" />
      </div>
      <phrase-contact v-if="session.mode" class="full-width"
        :init-val="initval" @ok="crypterphrase"/>
    </div>
  </q-expansion-item>

  <!-- Dialogue d'acceptation d'un nouveau sponsoring -->
  <acceptation-sponsoring v-if="ui.d.ASaccsp" :sp="sp" :pc="pc" :org="org"/>

  <q-dialog v-model="ui.d.Pubsub" persistent>
    <q-card :class="styp('sm') + ' q-pa-sm column items-center'">
      <div class="font-mono fs-xs">[{{perm}}]</div>
      <div class="titre-lg q-my-md text-center">{{$t('LOGpubsub')}}</div>
      <btn-cond class="q-my-md" flat :label="$t('jailu')" @ok="demperm"/>
    </q-card>
  </q-dialog>
</q-page>
</template>

<script>
import stores from '../stores/stores.mjs'
import { ref, onMounted } from 'vue'
import { decode } from '@msgpack/msgpack'

import { afficherDiag, beep, styp } from '../app/util.mjs'
import { connexion, GetSponsoring } from '../app/synchro.mjs'
import { Sponsoring, RegCles } from '../app/modele.mjs'
import { AMJ } from '../app/api.mjs'
import PhraseContact from '../components/PhraseContact.vue'
import AcceptationSponsoring from '../panels/AcceptationSponsoring.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import BtnCond from '../components/BtnCond.vue'
import { decrypter } from '../app/webcrypto.mjs'
import { CreationComptable } from '../app/operations4.mjs'

export default {
  name: 'PageLogin',

  components: { BtnCond, PhraseContact, AcceptationSponsoring, BoutonHelp },

  data () {
    return {
      infx: false,
      loginitem2: false,
      btncd: false,
      initval: '',
      sp: null,
      pc: null,
      org: ''
    }
  },

  computed: {
    loginitem () { return this.ui.loginitem },
    clrInfx () { return this.config.subJSON.startsWith('???') ? 'warning': 'green' }
  },

  watch: {
    loginitem(ap) {
      this.loginitem2 = !ap
      this.initval = ''
      this.session.setMode(0)
    },
    loginitem2 (ap) {
      this.ui.loginitem = !ap
    }
  },

  methods: {
    async demperm () {
      const p = await Notification.requestPermission()
      if (p === 'granted') {
        this.config.permission = true
        await this.session.setSubscription()
        console.log(this.config.subJSON)
      }
      this.ui.fD()
    },

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

    saisiePS () {
      this.ui.ps = { 
        orgext: this.org,
        verif: true,
        labelValider: 'ok',
        ok: this.creationComptable
      }
      this.ui.oD('PSouvrir')
    },

    reset () {  },

    async onps (phrase) {
      if (phrase) phrase.phrase = null
      await connexion(phrase, this.ui.razdb)
      if (!this.config.silenceHome) await beep()
    },

    async crypterphrase (pc) {
      this.pc = pc
      this.org = pc.org
      const session = stores.session
      try {
        /* Recherche sponsoring *******/
        RegCles.reset()
        const mode = session.mode
        stores.reset(true)
        this.hTC = this.pc.hpsc
        const res = await new GetSponsoring().run(this.org, this.pc.hps1, this.pc.hpsc)
        if (res && res.cleET) {
          if (res.cleET === false) {
            await afficherDiag(this.$t('LOGnosp'))
            this.raz()
            return
          } else {
            try {
              this.cleE = await decrypter(pc.pcb, res.cleET)
              this.saisiePS()
              return
            } catch (e) {
              await afficherDiag(this.$t('LOGnosp2'))
              this.raz()
              return
            }
          }
        }
        if (!res || !res.rowSponsoring) {
          await afficherDiag(this.$t('LOGnopp'))
          this.raz()
          return
        }
        try {
          const row = decode(res.rowSponsoring)
          session.setMode(mode)
          session.setOrg(this.org)
          this.sp = new Sponsoring()
          await this.sp.compileHS(row, this.pc.pcb)
          if (this.sp.dlv <  AMJ.amjUtc()) {
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
          this.qexp = true
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

    async creationComptable (pc) {
      await new CreationComptable().run(this.org, pc, this.cleE, this.hTC)
      await afficherDiag(this.$t('LOGcrec'))
    },

    raz () {
      this.btncd = false
      this.pc = null
      this.sp = null
      this.org = ''
      this.initval = ''
      this.session.setMode(0)
    }
  },

  setup () {
    const config = stores.config
    const session = stores.session
    const ui = stores.ui

    const perm = ref(Notification.permission)
    config.permission = perm.value === 'granted'

    onMounted(async () => {
      if (!config.permission) 
        ui.oD('Pubsub')
      if (config.permission) await session.setSubscription()
    })

    return {
      session, ui, styp,
      perm,
      config
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
