<template>
  <q-page class="column q-pa-xs splg">
    <div class="row q-my-sm items-center justify-center q-gutter-sm">
      <div> <!-- Changement de phrase secrète -->
        <btn-cond class="q-ml-sm" icon="manage_accounts" no-caps cond="cUrgence"
          :label="$t('CPTchps')" color="warning" @ok="ouvrirchgps"/>
        <bouton-help class="q-ml-sm" page="page1"/>
      </div>
      <div> <!-- Nouvel avatar -->
        <btn-cond class="q-ml-sm" icon="add" no-caps cond="cEdit"
          :label="$t('CPTnvav')" color="warning" @ok="ouvrirNvav"/>
        <bouton-help class="q-ml-sm" page="page1"/>
      </div>
      <!-- maj quotas du compte -->
      <btn-cond v-if="estDelegue || estA"
        icon="settings" :label="$t('CPTedq')" @ok="editerq" cond="cUrgence"/>
    </div>

    <div class="row justify-center">
    <span v-if="estA" class="q-pa-xs text-warning bg-yellow-3 text-bold">
      {{$t('compteA')}}
    </span>
    <span v-if="estDelegue" class="q-pa-xs text-warning bg-yellow-3 text-bold">
      {{$t('CPTdel', [session.compte.idp])}}
    </span>
    </div>

    <!-- Avatars du compte -->
    <q-card class="q-my-md q-pa-xs" v-for="(id, idx) in session.compte.mav" :key="id">
      <div v-if="eltav(id)" class="row items-start">
        <div class="col-auto column items-center q-mr-sm">
          <btn-cond flat icon="navigate_next" size="lg"
            :color="id === session.avatarId ? 'warning' : 'primary'" @ok="courant(id)"/>
          <btn-cond icon="delete" size="md" class="q-mt-sm" cond="cEdit"
            @ok="delAvatar(id)"/>
        </div>
        <div :class="'col ' + (id === session.avatarId ? 'courant' : 'zone')">
          <apercu-avatar edit  :idav="id" :idx="idx"/>
          <div class="row q-mt-sm q-gutter-sm">
            <btn-cond class="q-ml-sm" icon="group" cond="cVisu"
              :label="$t('ACgroupes')" @ok="courant(id, 2)"/>
            <q-badge class="cl1" color="secondary">{{nbgrps(id)}}</q-badge>
            <btn-cond class="q-ml-sm" icon="chat" cond="cVisu"
              :label="$t('ACseschats')" @ok="courant(id, 3)"/>
            <q-badge class="cl1" color="secondary">{{nbchats(id)}}</q-badge>
            <btn-cond class="q-ml-sm" icon="diversity_3" cond="cVisu"
              :label="$t('ACsponsorings')" @ok="courant(id, 4)"/>
            <q-badge class="cl1" color="secondary">{{nbspons(id)}}</q-badge>
          </div>
        </div>
      </div>
    </q-card>

    <!-- Dialogue de confirmation de mutation en compte A -->
    <q-dialog v-model="ui.d[idc].PCmuta" persistent>
      <q-card :class="styp('md')">
        <q-toolbar class="bg-secondary text-white">
          <btn-cond icon="close" color="warning" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg full-width text-center">{{$t('PPmutA')}}</q-toolbar-title>
        </q-toolbar>
        <div class="q-ma-sm text-center">
          <span class="titre-lg">{{$t('PPmutA2')}}</span>
          <bouton-help page="page2"/>
        </div>
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <bouton-confirm actif :confirmer="muterA"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialogue de création d'un nouvel avatar -->
    <q-dialog v-model="ui.d[idc].PCnvav" persistent>
      <q-card :class="styp('md')">
        <q-toolbar class="bg-secondary text-white">
          <btn-cond icon="close" color="warning" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg full-width text-center">{{$t('CPTnvav2')}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
        <nom-avatar icon-valider="check" verif :label-valider="$t('valider')" @ok-nom="oknomav" />
      </q-card>
    </q-dialog>

    <!-- Dialogue de changement de la phrase secrète -->
    <q-dialog v-model="ui.d[idc].PCchgps" persistent>
      <q-card :class="styp('sm') + 'column items-center'">
        <div class="row q-my-md q-gutter-md justify-center items-center">
          <btn-cond :label="$t('renoncer')" icon="close" @ok="ui.fD"/>
          <bouton-help page="page1"/>
        </div>
        <btn-cond :label="$t('CPTchps2')" cond="cUrgence" class="titre-lg" @ok="saisiePS" />
        <bouton-confirm class="q-my-md" :actif="ps !== null" :confirmer="changerps"/>
      </q-card>
    </q-dialog>

    <!-- Dialogue de suppression d'un avatar -->
    <suppr-avatar v-if="ui.d[idc] && ui.d[idc].SAsuppravatar" :avid="avid"/>

    <!-- Dialogue de mise à jour des quotas du compte -->
    <q-dialog v-model="ui.d[idc].PTedq" persistent>
      <q-card :class="styp('sm')">
        <q-toolbar class="bg-secondary text-white">
          <btn-cond color="warning" icon="close" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTqu')}}</q-toolbar-title>
        </q-toolbar>
        <choix-quotas class="q-mt-sm" v-model="quotas"/>
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond icon="check" :disable="quotas.err || !quotas.chg" :label="$t('valider')" @ok="validerq"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import { NouvelAvatar, ChangementPS, MuterCompteA } from '../app/operations4.mjs'
import { SetQuotas } from '../app/operations4.mjs'
import { ExistePhrase } from '../app/synchro.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import ApercuAvatar from '../components/ApercuAvatar.vue'
import NomAvatar from '../components/NomAvatar.vue'
import SupprAvatar from '../panels/SupprAvatar.vue'
import BoutonConfirm from '../components/BoutonConfirm.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import BtnCond from '../components/BtnCond.vue'
import { $t, styp, afficherDiag } from '../app/util.mjs'
import { isAppExc, ID } from '../app/api.mjs'
import { GetCompta, GetPartition, GetSynthese } from '../app/synchro.mjs'

const session = stores.session
const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
const aSt = stores.avatar
const fSt = stores.filtre

const ps = ref(null)
const nomav = ref('')
const avid = ref('')
const quotas = ref(null)
const synth = ref(null)

const estA = computed(() => session.estA)
const estDelegue = computed(() => session.estDelegue)

async function muterA () {
  await new MuterCompteA().run()
  ui.fD()
}

function ouvrirNvav () { 
  ui.oD('PCnvav', idc)
  nomav.value = ''
}

function ouvrirchgps () {
  ui.oD('PCchgps', idc)
  ps.value = null
}

function saisiePS () {
  ui.ps = { 
    orgext: session.org,
    verif: true,
    labelValider: 'ok',
    ok: okps
  }
  ui.oD('phrasesecrete', 'a')
}

function reset () { ps.value = null; ui.fD() }

function okps (p) { 
  if (ps.value) ps.value.phrase = null
  ps.value = p
}

async function changerps () {
  ui.fD()
  const ret = await new ExistePhrase().run(ps.value.hps1, 1)
  if (isAppExc(ret)) return reset()
  if (ret) {
    await afficherDiag($t('existe'))
    return
  }
  await new ChangementPS().run(ps.value)
  reset()
}

const eltav = (id) => aSt.getElt(id)
const nbchats = (id) => { const e = eltav(id); return e ? e.chats.size : 0 }
const nbspons = (id) => { const e = eltav(id); return e ? e.sponsorings.size : 0 }
const nbgrps = (id) => session.compte.idGroupes(id).size

function courant (id, action) {
  session.setAvatarId(id)
  if (action) switch (action){
    case 2 : { ui.setPage('groupesac'); return }
    case 3 : { 
      fSt.filtre.chats.tous = false
      ui.setPage('chats')
      return 
    }
    case 4 : { ui.setPage('sponsorings'); return }
  }
}

async function oknomav (nom) {
  if (!nom) { ui.fD(); return }
  if (session.compte.avatarDeNom(nom)) {
    await afficherDiag($t('CPTndc'))
    return
  }
  await new NouvelAvatar().run(nom)
  ui.fD()
}

async function editerq () {
  await new GetCompta().run()
  const c = session.compta
  if (estA.value) {
    await new GetSynthese().run()
    const synth = session.synthese
    const qA = synth.qA
    const qtA = synth.qtA
    let maxn = qA.qn - qtA.qn + c.qv.qn; if (maxn <= 0) maxn = c.qv.qn
    let maxc = qA.qc - qtA.qc + c.qv.qc; if (maxc <= 0) maxc = c.qv.qc
    let maxv = qA.qv - qtA.qv + c.qv.qv; if (maxv <= 0) maxv = c.qv.qv
    quotas.value = { qn: c.qv.qn, qv: c.qv.qv, qc: c.qv.qc, minn: 0, minv: 0, minc: 0,
      maxn, maxv, maxc,
      n: c.qv.nn + c.qv.nc + c.qv.ng, v: c.qv.v,
      err: ''
    }
  } else {
    await new GetPartition().run(session.compte.idp)
    const s = session.partition.synth
    let maxn = s.q.qn - s.qt.qn + c.qv.qn; if (maxn <= 0) maxn = c.qv.qn
    let maxc =s.q.qc - s.qt.qc + c.qv.qc; if (maxc <= 0) maxc = c.qv.qc
    let maxv = s.q.qv - s.qt.qv + c.qv.qv; if (maxv <= 0) maxv = c.qv.qv
    quotas.value = { 
      qn: c.qv.qn, qv: c.qv.qv, qc: c.qv.qc, minn: 0, minv: 0, minc: 0,
      maxn, maxv, maxc,
      n: c.qv.nn + c.qv.nc + c.qv.ng, v: c.qv.v,
      err: ''
    }
  }
  ui.oD('PTedq', idc)
}

async function validerq () {
  await new SetQuotas().run(session.compteId, quotas.value)
  ui.fD()
}

async function delAvatar (id) {
  if (session.compteId === id) { // c'est le compte
    if (session.compte.mav.size > 1) { // il reste des avatars secondaires
      await afficherDiag($t('SAVer1'))
      return
    }
    avid.value = ''
  } else 
    avid.value = id
  ui.oD('SAsuppravatar', idc)
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border-top: 1px solid $grey-5
  border-bottom: 1px solid $grey-5
.cl1
  position: relative
  top: -10px
  left: -15px
</style>
