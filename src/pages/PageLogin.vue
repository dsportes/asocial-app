<template>
<q-page class="column align-start items-center">

  <div class="row self-end items-center">
    <div v-if="infx" class="font-mono fs-sm text-italic q-mr-sm">
      {{config.subJSON.substring(0, 70) + '... ' + config.BUILD}}
    </div>
    <q-toggle :class="'q-my-xs bg-' + clrInfx " v-model="infx" color="grey-5" size="25px"/>
  </div>

  <q-expansion-item class="q-mt-xl spsm" group="g1" v-model="ui.reLogin">
    <template v-slot:header>
      <div class="full-width titre-lg row justify-between bord1">
        <div>{{$t('LOGconn2')}}</div>
        <!--bouton-help page="page_login_cn" class="col-auto"/-->
      </div>
    </template>

    <div class="row justify-center q-gutter-sm q-mt-sm q-mr-xl">
      <btn-cond class="titre-lg" no-caps @ok="ouvrirPS(1)">
        <div class="row items-center q-gutter-sm">
          <q-icon size="sm"><img src="~assets/sync_saved_locally.svg"/></q-icon>
          <div>{{$t('sync')}}</div>
        </div>
      </btn-cond>

      <btn-cond class="titre-lg" no-caps @ok="ouvrirPS(2)">
        <div class="row items-center q-gutter-sm">
          <q-icon size="sm"><img src="~assets/incognito_blanc.svg"/></q-icon>
          <div>{{$t('incognito')}}</div>
        </div>
      </btn-cond>
      <btn-cond class="titre-lg" icon="airplanemode_active" no-caps
        :label="$t('avion')" @ok="ouvrirPS(3)"/>
    </div>
  </q-expansion-item>

  <q-expansion-item class="q-mt-xl spsm" group="g1">
    <template v-slot:header>
      <div class="full-width titre-lg row justify-between bord1">
        <div>{{$t('LOGconn3')}}</div>
        <!--bouton-help page="page_login_cn" class="col-auto"/-->
      </div>
    </template>

    <div class="q-px-sm">
      <div class="titre-md q-my-md">{{$t('LOGpar')}}</div>
      <div class="col q-py-sm q-gutter-md row justify-center">
        <q-radio dense v-model="session.mode" :val="1">
          <div class="row items-center q-gutter-sm">
            <q-icon size="sm"><img src="~assets/sync_saved_locally.svg"/></q-icon>
            <div>{{$t('sync')}}</div>
          </div>
        </q-radio>
        <q-radio dense v-model="session.mode" :val="2">
          <div class="row items-center q-gutter-sm">
            <q-icon size="sm"><img src="~assets/incognito_blanc.svg"/></q-icon>
            <div>{{$t('incognito')}}</div>
          </div>
        </q-radio>
      </div>
      <phrase-contact v-if="session.mode" class="full-width"
        :init-val="initval" @ok="crypterphrase"/>
    </div>
  </q-expansion-item>

  <!-- Dialogue d'acceptation d'un nouveau sponsoring -->
  <q-dialog v-if="ui.xD('ASaccsp', idc)" v-model="ui.d[idc].ASaccsp" full-height position="left" persistent>
    <acceptation-sponsoring :sp="sp" :pc="pc" :org="org"/>
  </q-dialog>

  <!-- Dialogue de demande de permission de notification -->
  <q-dialog v-if="ui.xD('pubsub', idc)" v-model="ui.d[idc].pubsub" persistent>
    <q-card :class="styp('sm') + ' q-pa-sm column items-center'">
      <!--div class="font-mono fs-xs">[{{perm}}]</div-->
      <div class="titre-lg q-my-md text-center">{{$t('LOGpubsub')}}</div>

      <btn-cond v-if="config.permState === 'prompt'" flat :label="$t('MLAntfr1')" @ok="demperm"/>
      <div v-else class="column justify-center">
        <div class="titre-lg text-italic text-center">{{$t('MLAntfr2')}}</div>
        <btn-cond class="q-my-md" flat :label="$t('jailu')" @ok="ui.fD()"/>
      </div>

    </q-card>
  </q-dialog>
</q-page>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const $t = useI18n().t

import stores from '../stores/stores.mjs'
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { decode } from '@msgpack/msgpack'

import { afficherDiag, beep, styp } from '../app/util.mjs'
import { connexion } from '../app/synchro.mjs'
import { Sponsoring, RegCles } from '../app/modele.mjs'
import { AMJ } from '../app/api.mjs'
import PhraseContact from '../components/PhraseContact.vue'
import AcceptationSponsoring from '../panels/AcceptationSponsoring.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import BtnCond from '../components/BtnCond.vue'
import { decrypter } from '../app/webcrypto.mjs'
import { CreationComptable, GetSponsoring } from '../app/operations4.mjs'

const config = stores.config
const session = stores.session

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

const clrInfx = computed(() => config.subJSON.startsWith('???') ? 'warning': 'green')

const infx = ref()
const btncd = ref()
const initval = ref()
const sp = ref()
const pc = ref()
const org = ref()
const hTC = ref()
const cleE = ref()

function raz () {
  btncd.value = false
  pc.value = null
  sp.value = null
  org.value = ''
  initval.value = ''
}

raz()

async function demperm () {
  const p = await Notification.requestPermission()
  console.log('Notification: ', p)
  ui.fD()
}

function ouvrirPS (mode) {
  session.setMode(mode)
  ui.ps = { 
    login: true, 
    labelValider: "LOGconn", 
    iconValider: "send",
    ok: onps
  }
  ui.oD('phrasesecrete', 'a')
}

function saisiePS () {
  ui.ps = { 
    orgext: org.value,
    verif: true,
    labelValider: 'ok',
    ok: creationComptable
  }
  ui.oD('phrasesecrete', 'a')
}

async function onps (phrase) {
  if (phrase) phrase.phrase = null
  await connexion(phrase, ui.razdb)
  if (!config.silenceHome) await beep()
}

async function crypterphrase (p) {
  pc.value = p
  org.value = p.org
  try {
    /* Recherche sponsoring *******/
    RegCles.reset()
    const mode = session.mode
    stores.reset(true)
    hTC.value = p.hpsc
    const res = await new GetSponsoring().run(org.value, p.hps1, p.hpsc)
    if (res && res.cleET) {
      if (res.cleET === false) {
        await afficherDiag($t('LOGnosp'))
        raz()
        return
      } else {
        try {
          cleE.value = await decrypter(p.pcb, res.cleET)
          saisiePS()
          return
        } catch (e) {
          await afficherDiag($t('LOGnosp2'))
          raz()
          return
        }
      }
    }
    if (!res || !res.rowSponsoring) {
      await afficherDiag($t('LOGnopp'))
      raz()
      return
    }
    try {
      const row = decode(res.rowSponsoring)
      session.setMode(mode)
      session.setOrg(org.value)
      sp.value = new Sponsoring()
      await sp.value.compileHS(row, p.pcb)
      if (sp.value.dlv <  AMJ.amjUtc()) {
        await afficherDiag($t('LOGppinv'))
        raz()
        return                  
      }
      if (sp.value.st !== 0) {
        await afficherDiag($t('LOGsp' + sp.value.st))
        raz()
        return                  
      }
      ui.oD('ASaccsp', idc)
    } catch (e) {
      await afficherDiag($t('LOGppatt'))
      raz()        
    }
  } catch (e) {
    console.log(e)
    raz()
  }
}

async function creationComptable (pc) {
  await new CreationComptable().run(org.value, pc, cleE.value, hTC.value)
  await afficherDiag($t('LOGcrec'))
}

setTimeout(() => {
  if (!config.permission) 
    ui.oD('pubsub', idc)
}, 1000)

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord1
  border-bottom: 1px solid $orange
.disabled
  pointer-events: none
  opacity: 0.4
</style>
