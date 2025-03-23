<template> 
  <div class="spmd fs-md q-pa-sm">
    <!-- Nouveau sponsoring -->
    <div v-if="session.estDelegue || session.estComptable || session.espace.opt"
        class="q-my-md text-center">
      <btn-cond icon="manage_accounts" :label="$t('NPnouv')" color="warning" cond="cEdit" @ok="nouveausp"/>
    </div>

    <div class="q-my-md q-pa-sm titre-lg text-center">{{sponsorings.length ? $t('NPspex') : $t('NPnosp')}}</div>

    <div v-for="(sp, idx) in sponsorings" :key="sp.ids">
      <q-expansion-item switch-toggle-side dense class="q-mt-xs"
        group="somegroup" :default-opened="idx === 0" header-class="tbs">
        <template v-slot:header>
          <div class="full-width row justify-between items-center">
            <div class="titre-lg text-bold">{{sp.nom}}</div>
            <div class="row q-gutter-md items-center">
              <q-icon :name="icx[sp.st]" size="md" :color="clx[sp.st]"/>
              <div class="titre-md text-italic">{{$t('NPst' + sp.st, [dhcool(sp.dh)])}}</div>
            </div>
          </div>
        </template>

        <div class="q-ml-lg column q-gutter-sm">
          <div class="titre-md q-mt-md">{{$t('NPphr')}}
            <span class="q-ml-sm font-mono text-bold fs-md">{{sp.psp}}</span>
          </div>
          <div class="titre-md">{{$t('NPdlv')}}
            <span class="q-ml-sm font-mono text-bold fs-md">{{AMJ.editDeAmj(sp.dlv)}}</span>
          </div>

          <div v-if="sp.estA" class="titre-md">{{$t('compteA')}}</div>
          <div v-else class="titre-md">{{$t(sp.del ? 'compteD' : 'compteO', [sp.partitionId || ''])}}</div>
            
          <div>{{$t('don', [sp.don])}}</div>

          <div>{{$t('conf' + (sp.dconf ? '' : '2'))}}</div>

          <div>
            <div class="titre-md">{{$t('NPquo')}}</div>
            <quotas-vols class="q-ml-md" :vols="sp.quotas"/>
          </div>

          <div>
            <div class="titre-md">{{$t('NPmot')}}</div>
            <show-html class="q-mb-xs bord" zoom maxh="4rem" :texte="sp.ard"/>
          </div>

          <div v-if="sp.st===0" class="q-my-sm row items-center q-gutter-sm">
            <div class="titre-md text-italic q-mr-sm">{{$t('NPpro')}}</div>
            <btn-cond class="q-mr-xs" cond="cEdit"
              :label="$t('NPpro7')" @ok="prolonger(sp, 7)"/>
            <btn-cond class="q-mr-xs" cond="cEdit"
              :label="$t('NPpro20')" @ok="prolonger(sp, 20)"/>
            <btn-cond class="q-mr-lg" cond="cEdit"
              :label="$t('NPpro30')" @ok="prolonger(sp, 30)"/>
          </div>

          <div class="text-right">
            <btn-cond v-if="sp.st===0" class="q-my-md" color="warning" cond="cEdit"
              icon="close" :label="$t('NPann')" @ok="prolonger(sp, 0)"/>
          </div>
        </div>
      </q-expansion-item>
    </div>

    <!-- Dialogue de création d'un sponsoring: pour un délégué et un compte "O" dans sa propre partition -->
    <q-dialog v-if="ui.d[idc] && ui.d[idc].NSnvsp" v-model="ui.d[idc].NSnvsp" position="left" persistent>
      <nouveau-sponsoring/>
    </q-dialog>

  </div>
</template>

<script setup>
import { computed, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import { AMJ, UNITEN, UNITEV } from '../app/api.mjs'
import { dhcool, edvol } from '../app/util.mjs'
import ShowHtml from '../components/ShowHtml.vue'
import NouveauSponsoring from '../panels/NouveauSponsoring.vue'
import BtnCond from '../components/BtnCond.vue'
import QuotasVols from '../components/QuotasVols.vue'
import { ProlongerSponsoring, GetPartition } from '../app/operations4.mjs'

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

const aSt = stores.avatar
const session = stores.session

const clx = ['white', 'negative', 'positive', 'negative']
const icx = ['timer', 'block', 'check', 'close']
/*
  NPst0: 'Proposition en attente de réponse déposée {0}',
  NPst1: 'Proposition refusée {0}',
  NPst2: 'Proposition acceptée {0}',
  NPst3: 'Proposition annulée par l\'avatar sponsor {0}',
*/

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
