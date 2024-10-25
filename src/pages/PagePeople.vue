<template>
  <q-page class="column q-pl-xs q-mr-sm spmd">
    <q-card v-if="session.accesNet" class="q-my-md q-pa-xs row justify-center">
      <btn-cond class="q-my-sm" 
        :cond="session.estAdmin ? 'cUrgence' : 'cVisu'"
        :label="$t('CVraf')" @ok="rafCvs"/>
    </q-card>

    <div v-if="pSt.map.size && !pSt.peLpF" class="q-my-md titre-lg text-italic">
      {{$t('APnb', [pSt.map.size])}}
    </div>
    
    <div v-if="pSt.peLpF.length">
      <q-card class="q-my-md" v-for="(p, idx) in pSt.peLpF" :key="p.id">
        <apercu-genx class="q-pa-xs" :id="p.id" :idx="idx" 
          :del="session.eltPart(p.id).del"/>
      </q-card>
    </div>

    <q-page-sticky v-if="session.accesNet && !session.estA" position="top-left" :offset="[3, 3]">
      <btn-cond icon="refresh" @ok="reload()" :cond="session.estAdmin ? 'cUrgence' : 'cVisu'"/>
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

import stores from '../stores/stores.mjs'
import ApercuGenx from '../components/ApercuGenx.vue'
import BtnCond from '../components/BtnCond.vue'
import { RafraichirCvsAv } from '../app/operations4.mjs'
import { GetPartition } from '../app/synchro.mjs'
import { afficher8000, $t } from '../app/util.mjs'

const session = stores.session
const ui = stores.ui
const pSt = stores.people

async function reload () {
  if (session.accesNet && !session.estA) await new GetPartition().run(session.compte.idp)
}

if (session.accesNet) onMounted(async () => { await reload() })

async function rafCvs () {
  let nc = 0, nv = 0
  for (const id of session.compte.mav) {
    const r = await new RafraichirCvsAv().run(id, true)
    if (typeof r ==='number') {
      await afficher8000(r, id, 0)
      continue
    }
    const [x, y] = r
    nc += x; nv += y
  }
  ui.afficherMessage($t('CVraf2', [nc, nv]), false)
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
