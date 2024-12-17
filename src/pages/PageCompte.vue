<template>
  <q-page class="column q-pa-xs splg">
    <div class="column q-my-sm items-center q-gutter-sm">
      <div v-if="estA" class="text-warning text-italic text-bold">
        {{$t('compteA')}}
      </div>

      <div v-if="estDelegue">
        <span class="q-pa-xs text-warning text-italic text-bold">
          {{$t('CPTdel', [session.compte.idp])}}</span>
        <btn-cond class="q-ml-sm" @ok="maPartition" icon="open_in_new"/>
      </div>

      <div v-if="estDelegue">
        <btn-cond v-if="estDelegue" :label="$t('CPTautoA')" flat icon="check" color="warning"
          @ok="muterA"/>
      </div>

      <div> <!-- Changement de phrase secrète -->
        <btn-cond class="q-ml-sm" icon="manage_accounts" cond="cUrgence"
          :label="$t('CPTchps')" flat @ok="saisiePS"/>
      </div>

      <div> <!-- Nouvel avatar -->
        <btn-cond class="q-ml-sm" icon="add" cond="cEdit"
          :label="$t('CPTnvav')" flat @ok="ouvrirNvav"/>
      </div>
      
      <div> <!-- maj quotas du compte -->
        <btn-cond v-if="estDelegue || estA"
          icon="settings" flat :label="$t('CPTedq')" @ok="editerq" cond="cUrgence"/>
      </div>
    </div>

    <!-- Avatars du compte -->
    <q-card class="q-my-md q-pa-xs" v-for="(id, idx) in session.compte.mav" :key="id">
      <div v-if="eltav(id)" class="row items-start">
        <div class="col-auto column items-center q-mr-sm">
          <!--btn-cond flat icon="navigate_next" size="lg"
            :color="id === session.avatarId ? 'warning' : 'primary'" @ok="courant(id)"/-->
          <btn-cond icon="delete" size="md" class="q-mt-sm" cond="cEdit"
            @ok="delAvatar(id)"/>
        </div>
        <div :class="'col ' + (id === session.avatarId ? 'courant' : 'zone')">
          <apercu-avatar edit  :idav="id" :idx="idx"/>
          <div class="row q-mt-sm q-gutter-xs justify-center">
            <btn-cond icon="group" cond="cVisu"
              :label="$t('ACgroupes')" @ok="courant(id, 2)"/>
            <q-badge class="cl1" color="secondary">{{nbgrps(id)}}</q-badge>
            <btn-cond icon="chat" cond="cVisu"
              :label="$t('ACseschats')" @ok="courant(id, 3)"/>
            <q-badge class="cl1" color="secondary">{{nbchats(id)}}</q-badge>
            <btn-cond icon="diversity_3" cond="cVisu"
              :label="$t('ACsponsorings')" @ok="courant(id, 4)"/>
            <q-badge class="cl1" color="secondary">{{nbspons(id)}}</q-badge>
          </div>
        </div>
      </div>
    </q-card>

    <!-- Dialogue de mutation en compte A -->
    <dial-std1 v-if="m1" v-model="m1" :titre="$t('CPTautoA')" okic="change_history"
      confok warning :disable="quotas.err !== ''" cond="cUrgence" :okfn="mutA">
      <q-card-section>
        <choix-quotas v-model="quotas"/>
        <div v-if="quotas.err" class="msg">{{$t('PPquot')}}</div>
      </q-card-section>
    </dial-std1>

    <!-- Dialogue de création d'un nouvel avatar -->
    <q-dialog v-model="ui.d[idc].PCnvav" persistent>
      <q-card :class="styp('md')">
        <q-toolbar class="tbs">
          <btn-cond icon="close" color="warning" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg full-width text-center">{{$t('CPTnvav2')}}</q-toolbar-title>
        </q-toolbar>
        <nom-avatar class="q-my-xs q-mt-sm" icon-valider="check" verif :label-valider="$t('valider')" @ok-nom="oknom" />
      </q-card>
    </q-dialog>

    <!-- Dialogue de suppression d'un avatar -->
    <dial-std2 v-if="m3" v-model="m3" help="suppr_avatar" :titre="$t('SAVtit1', [cv.nom])">
      <suppr-avatar :avid="avid"/>
    </dial-std2>

    <!-- Dialogue de mise à jour des quotas du compte -->
    <dial-std1 v-if="m2" v-model="m2" :titre="$t('PTqu')"
      warning cond="cUrgence" :okfn="validerq">
      <choix-quotas class="q-mt-sm" v-model="quotas"/>
    </dial-std1>

  </q-page>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import { GetSynthese, NouvelAvatar, ChangementPS, MuterCompteAauto, GetCompta, GetPartition } from '../app/operations4.mjs'
import { SetQuotas } from '../app/operations4.mjs'
import { ExistePhrase } from '../app/operations4.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import ApercuAvatar from '../components/ApercuAvatar.vue'
import NomAvatar from '../components/NomAvatar.vue'
import SupprAvatar from '../panels/SupprAvatar.vue'
import BoutonConfirm from '../components/BoutonConfirm.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import BtnCond from '../components/BtnCond.vue'
import DialStd1 from '../dialogues/DialStd1.vue'
import DialStd2 from '../dialogues/DialStd2.vue'
import { $t, styp, afficherDiag } from '../app/util.mjs'
import { isAppExc, ID } from '../app/api.mjs'

const session = stores.session
const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
const m1 = computed(() => ui.d[idc].PCmuta)
const m2 = computed(() => ui.d[idc].PTedq)
const m3 = computed(() => ui.d[idc].SAsuppravatar)

const aSt = stores.avatar
const fSt = stores.filtre

const cv = computed(() => session.getCV(avid.value || session.compteId))

const ps = ref(null)
const nomav = ref('')
const avid = ref('')
const quotas = ref(null)
const synth = ref(null)
const cf = ref(false)

const estA = computed(() => session.estA)
const estDelegue = computed(() => session.estDelegue)

async function maPartition () { 
  await new GetPartition().run(session.compte.idp)
  ui.setPage('partition')
}

function ouvrirNvav () { 
  ui.oD('PCnvav', idc)
  nomav.value = ''
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

async function okps (p) { 
  if (!p) return
  ps.value = p
  const ret = await new ExistePhrase().run(ps.value.hps1, 1)
  if (isAppExc(ret)) { ps.value = null; return }
  if (ret) {
    await afficherDiag($t('existe'))
    return
  }
  await new ChangementPS().run(ps.value)
  ps.value = null
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

async function oknom (nom) {
  if (!nom) { ui.fD(); return }
  if (session.compte.avatarDeNom(nom)) {
    await afficherDiag($t('CPTndc'))
    return
  }
  await new NouvelAvatar().run(nom)
  ui.fD()
}

async function editerq () { // Délégués et comptes "A" - Pour le compte lui-même
  await new GetCompta().run()
  if (!estA.value) await new GetPartition().run(session.compte.idp)
  quotas.value = estA.value ? await session.getQuotasA(session.compta.compteurs.qv) 
    : await session.getQuotasP(session.compta.compteurs.qv)
  ui.oD('PTedq', idc)
}

async function validerq () {
  await new SetQuotas().run(session.compteId, quotas.value)
  ui.fD()
}

async function muterA () { // Délégués seulement - Pour le compte lui-même
  await new GetCompta().run()
  quotas.value = await session.getQuotasA(session.compta.compteurs.qv)
  cf.value = false
  ui.oD('PCmuta', idc)
}

async function mutA () {
  await new MuterCompteAauto().run(quotas.value)
  await new GetSynthese().run()
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
