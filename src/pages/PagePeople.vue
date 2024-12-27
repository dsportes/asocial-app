<template>
  <q-page class="column q-pl-xs q-mr-sm spmd">
    <q-card v-if="session.accesNet" class="q-my-md q-pa-xs row justify-center">
      <btn-cond class="q-my-sm" 
        :cond="session.estAdmin ? 'cUrgence' : 'cVisu'"
        :label="$t('CVraf')" @ok="rafCvs"/>
    </q-card>

    <div class="q-my-md titre-lg text-italic">
      <div v-if="!pSt.map.size">{{$t('APnb0')}}</div>
      <div v-else>
        <span v-if="peLpF && peLpF.length === pSt.map.size">
          {{peLpF.length === 1 ? $t('APnb9') : $t('APnb8', [peLpF.length])}}
        </span>
        <span v-else>{{$t('APnb', peLpF ? peLpF.length : 0, {count: peLpF ? peLpF.length : 0})}} {{$t('APsur', [pSt.map.size])}}</span>
      </div>
    </div>


    <div v-if="peLpF.length">
      <q-expansion-item v-for="(p, idx) in peLpF" :key="p.id"
        :header-class="dkli(idx)" switch-toggle-side expand-separator dense 
        group="somegroup">
        <template v-slot:header>
          <div class="row justify-between items-start full-width">
            <div class="row q-gutter-sm items-center">
              <img :src="session.getCV(p.id).photo" class="photomax"/>
              <div class="titre-md text-bold">{{session.getCV(p.id).nom}}</div>
            </div>
            <!--btn-cond icon="zoom_in" round stop @ok="ouvrirdetails(p.id)"/-->
          </div>
        </template>
        <apercu-genx class="q-ml-xl" :id="p.id" :idx="idx"
          :del="session.eltPart(p.id).del"/>
      </q-expansion-item>
    </div>

  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

import stores from '../stores/stores.mjs'
import ApercuGenx from '../components/ApercuGenx.vue'
import BtnCond from '../components/BtnCond.vue'
import { GetPartition, RafraichirCvsAv } from '../app/operations4.mjs'
import { afficher8000, $t, dkli } from '../app/util.mjs'
import { ID } from '../app/api.mjs'

const session = stores.session
const ui = stores.ui
const pSt = stores.people
const gSt = stores.groupe

const peLpF = computed(() => {
  const ci = session.compti
  const f = stores.filtre.filtre.people
  const fsetp = f.mcp && f.mcp.size ? f.mcp : null
  const fsetn = f.mcn && f.mcn.size ? f.mcn : null
  const r = []
  for (const [id, p] of pSt.visiblePeople) {
    const cv = session.getCV(id)
    if (f.nom && !cv.nom.startsWith(f.nom) && (!ci.stW(id, f.nom))) continue
    if (f.avecgr && (!p.sgr.size)) continue
    if (fsetp && !ci.aHT(id, fsetp)) continue
    if (fsetn && ci.aHT(id, fsetn)) continue
    r.push({ id, cv, nom: cv.nom, sgr: p.sgr, sch: p.sch })
  }
  r.sort((a, b) => (ID.estComptable(a.id) || a.nom < b.nom) ? -1 : (a.nom > b.nom ? 1 : 0))
  return r
})

watch(peLpF, (ap) => {ui.fmsg(ap.length)})

/*
function ouvrirdetails (id) {
  session.setPeopleId(id)
  ui.oD('detailspeople', 'a')
}
*/

/*
async function reload () {
  if (session.accesNet && !session.estA) await new GetPartition().run(session.compte.idp)
}

if (session.accesNet) onMounted(async () => { await reload() })
*/

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
