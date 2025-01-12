<template>
  <q-page class="column q-pl-xs q-mr-sm spmd" style="padding-top:5em">
    <div v-if="nblst">
      
      <div class="q-my-md titre-lg text-italic">
        {{$t('APnbsel', nblst.nb, { count: nblst.nb})}}
        <span>{{$t('APsur', [lst1.length])}}</span>
      </div>

      <div v-if="nblst.lst.length">
        <q-expansion-item v-for="(p, idx) in nblst.lst" :key="p.id"
          :header-class="dkli(idx)" switch-toggle-side expand-separator dense 
          group="somegroup">
          <template v-slot:header>
            <div class="column full-width">
            <div class="row justify-between items-center">
              <div class="row q-gutter-sm items-center">
                <img :src="p.cv.photo" class="photomax"/>
                <div class="titre-md text-bold">{{p.cv.nom}}</div>
              </div>
              <btn-cond v-if="p.d[0] <= 3" style="color:black !important;"
                cond="cEdit" icon="check" color="green-5" :label="$t('PPctcok')"
                  @ok="select(p)"/>
            </div>
            <div v-if="p.d[0] > 3" class="q-ml-xl">
              <span class="msg">{{$t('PPctc' + p.d[0])}}
                <span v-if="p.d[1]" class="q-ml-xs">({{$t('AMm' + p.d[1])}}}</span>
              </span>
            </div>
            </div>
          </template>
          <apercu-genx class="q-ml-xl" :id="p.id" :idx="idx" :del="session.eltPart(p.id).del"/>
        </q-expansion-item>
      </div>
    </div>

    <!-- Confirmation du contact ------------------------------------------------>
    <q-dialog v-model="ui.d[idc].PInvit" persistent>
      <q-card :class="styp('sm')">
        <q-toolbar class="tbs">
          <btn-cond color="warning" icon="close" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center">{{$t('PItit', [nomg])}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
        <div class="q-pa-xs">
          <div class="titre-md q-mb-xs text-center">{{$t('PItx1')}}</div>
          <apercu-genx class="q-pa-xs" :id="session.peopleId" :idx="0"/>
          <q-card-actions align="right" class="q-gutter-sm">
            <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD" />
            <btn-cond color="warning" icon="add" cond="cEdit"
            :label="$t('ajouter')" @ok="okAjouter" />
          </q-card-actions>
        </div>
      </q-card>
    </q-dialog>

    <q-page-sticky v-if="session.accesNet" position="top" :offset="[0, 0]">
      <div class="row tbs justify-between" style="width:100vw">
        <btn-cond :label="$t('renoncer')" @ok="ui.setPage('groupe', 'groupe')"/>
        <!--q-checkbox v-model="propos" :label="$t('PIfi')" /-->
        <btn-cond :label="$t('CVraf')" @ok="rafCvs"/>
      </div>
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import ApercuGenx from '../components/ApercuGenx.vue'
import BtnCond from '../components/BtnCond.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import { RafraichirCvsAv } from '../app/operations4.mjs'
import { NouveauContact } from '../app/operations4.mjs'
import { dkli, styp, afficher8000 } from '../app/util.mjs'

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
const session = stores.session
const pSt = stores.people
const gSt = stores.groupe

const nomg = computed(() => session.getCV(session.groupeId).nom)
    
const lst1 = computed(() => { 
  const l = []
  session.compte.lstAvatars.forEach(x => {
    const y = { id: x.id }
    y.d = gSt.diagContact(x.id)
    y.cv = session.getCV(x.id)
    l.push(y)
  })
  pSt.map.forEach((x, id) => {
    const y = { id: id }
    y.d = gSt.diagContact(id)
    y.cv = session.getCV(id)
    l.push(y)
  })
  l.sort((a, b) => { return a.cv.nom < b.cv.nom ? -1 : (a.cv.nom === b.cv.nom ? 0 : 1)})
  return l
})

const nblst = computed(() => { 
  const l = []
  let nb = 0
  const f = stores.filtre.filtre.contactgr
  const ci = session.compti
  const fsetp = f.mcp && f.mcp.size ? f.mcp : null
  const fsetn = f.mcn && f.mcn.size ? f.mcn : null
  for (const x of lst1.value) {
    if (f.invitables && x.d[0]) continue
    if (f.nom && !x.cv.nom.startsWith(f.nom) && (!ci.stW(x.id, f.nom))) continue
    if (fsetp && !ci.aHT(x.id, fsetp)) continue
    if (fsetn && ci.aHT(x.id, fsetn)) continue
    if (x.d[0] < 3) nb++
    l.push(x)
  }
  return { nb, lst: l}
})

async function rafCvs () {
  let nc = 0, nv = 0
  for (const id of session.compte.mav) {
    const r = await new RafraichirCvsAv().run(id)
    if (typeof r ==='number') {
      await afficher8000(r, id, session.groupeId)
      continue
    }
    const [x, y] = r
    nc += x; nv += y
  }
  stores.ui.afficherMessage($t('CVraf2', [nc, nv]), false)
}

function select (p) {
  session.setPeopleId(p.id)
  ui.oD('PInvit', idc)
}

async function okAjouter () {
  const r = await new NouveauContact().run()
  if (r) await afficher8000(r, session.peopleId, session.groupeId)
  else ui.setPage('groupe', 'membres')
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
