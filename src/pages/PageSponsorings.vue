<template> 
  <q-page>
    <q-card class="spmd q-mb-lg q-pa-sm row justify-center items-center" 
      v-if="session.estDelegue || session.estComptable || (session.estA && session.espace.opt > 0)"> 
      <!-- Nouveau sponsoring -->
      <btn-cond class="q-mt-sm q-ml-xs" size="md" icon="manage_accounts"
        :label="$t('NPnouv')" color="warning" cond="cEdit" @ok="nouveausp"/>
      <bouton-help class="q-ml-sm" page="page1"/>
    </q-card>

    <q-card class="spmd q-pa-sm titre-lg text-center">{{sponsorings.length ? $t('NPspex') : $t('NPnosp')}}</q-card>

    <q-card class="spmd q-my-md" v-for="(sp, idx) in sponsorings" :key="sp.ids">
      <div :class="'q-px-sm ' + dkli(idx)">
        <div :class="'titre-md ' + clx[sp.st]">{{$t('NPst' + sp.st, [dhcool(sp.dh)])}}</div>
        <div class="titre-md">{{$t('NPphr')}}
          <span class="q-ml-sm font-mono text-bold fs-md">{{sp.psp}}</span>
        </div>
        <div class="titre-md">{{$t('NPdlv')}}
          <span class="q-ml-sm font-mono text-bold fs-md">{{AMJ.editDeAmj(sp.dlv)}}</span>
        </div>
        <div class="titre-md">{{$t('NPnom')}}
          <span class="text-bold font-mono q-px-md">{{sp.nom}}</span>
        </div>

        <div v-if="sp.estA" class="row q-gutter-sm titre-md">
          <div class="text-warning">{{$t('compteA')}}</div>
          <div>{{$t('don', [sp.don])}}</div>
        </div>
        <div v-else class="titre-md">{{$t(sp.del ? 'compteD' : 'compteO', [sp.partitionId || 0])}}</div>
        <div v-if="sp.dconf">{{$t('conf')}}</div>

        <div class="titre-md">{{$t('NPquo')}}</div>
        <quotas-vols class="q-ml-md" :vols="sp.quotas" noutil/>
        <div class="titre-md q-mt-xs">{{$t('NPmot')}}</div>
        <show-html class="q-mb-xs bord" zoom maxh="4rem" :texte="sp.ard" :idx="idx"/>

        <div v-if="sp.st===0" class="q-my-sm row justify-center items-center q-gutter-sm">
          <div class="titre-md text-italic q-mr-sm">{{$t('NPpro')}}</div>
          <btn-cond class="q-mr-xs" cond="cEdit"
            :label="$t('NPpro7')" @ok="prolonger(sp, 7)"/>
          <btn-cond class="q-mr-xs" cond="cEdit"
            :label="$t('NPpro20')" @ok="prolonger(sp, 20)"/>
          <btn-cond class="q-mr-lg" cond="cEdit"
            :label="$t('NPpro30')" @ok="prolonger(sp, 30)"/>
        </div>
        <div class="text-center">
          <btn-cond v-if="sp.st===0" class="q-my-md" color="warning" cond="cEdit"
            :label="$t('NPann')" @ok="prolonger(sp, 0)"/>
        </div>
      </div>
    </q-card>

    <!-- Dialogue de création d'un sponsoring ici la partition est la sienne -->
    <nouveau-sponsoring v-if="ui.d[idc] && ui.d[idc].NSnvsp" :idc2="idc"/>

  </q-page>
</template>

<script setup>
import { computed, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import { AMJ, UNITEN, UNITEV, ID } from '../app/api.mjs'
import { dhcool, edvol, dkli } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import ShowHtml from '../components/ShowHtml.vue'
import NouveauSponsoring from '../panels/NouveauSponsoring.vue'
import BtnCond from '../components/BtnCond.vue'
import QuotasVols from '../components/QuotasVols.vue'
import { ProlongerSponsoring, GetPartition } from '../app/operations4.mjs'

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

const aSt = stores.avatar
const session = stores.session

const clx = [
  'text-primary',
  'text-warning bg-yellow-3',
  'text-green-5',
  'text-negative bg-yellow-3',
]

const sponsorings = computed(() => { 
  const r = Array.from(aSt.getSponsorings(aSt.avC.id).values()) || []
  r.sort((a,b) => { return a.dh < b.dh ? 1 : (a.dh === b.dh ? 0 : -1)} )
  return r
})

const ed1 = (f) => edvol(f * UNITEN)
const ed2 = (f) => edvol(f * UNITEV)

async function nouveausp () { 
  if (session.compte.idp) await new GetPartition().run(session.compte.idp)
  ui.oD('NSnvsp', idc) 
}

async function prolonger (sp, nj) {
  const ndlv = !nj ? 0 : AMJ.amjUtcPlusNbj(session.auj, nj)
  new ProlongerSponsoring().run(sp, ndlv)
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border-top: 1px solid $grey-5
  border-bottom: 1px solid $grey-5
</style>
