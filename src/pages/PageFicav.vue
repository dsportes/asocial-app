<template>
<q-page class="q-pa-xs">
  <div v-if="lst.length === 0" class="titre-lg text-italic">{{$t('FAVnone')}}</div>

  <div v-else v-for="(x, idx) in lst" :key="x.fa.id" class="column">
    <q-expansion-item switch-toggle-side expand-separator dense>
      <template v-slot:header>
        <div class="row justify-between full-width tbs itemd-center">
          <div class="col row q-gutter-xs">
            <span class="font-mono text-bold">{{x.fa.nom}}</span>
            <span v-if="x.f.info" class="font-mono">{{x.f.info}}</span>
          </div>
          <q-icon class="col-auto bg-white" round :name="icx[stx(x)]" :color="clrx[stx(x)]" size="md"/>
        </div>
      </template>

      <div :class="'q-ml-xl q-mt-xs q-mr-xs q-pb-sm ' + dkli(idx)">
        <div class="row justify-between q-mb-sm q-gutter-sm">
          <div class="col row q-gutter-xs">
            <span class="font-mono">(#{{x.fa.id}})</span>
            <span>{{x.f.type}}</span>
            <span>{{edvol(x.f.lg)}}</span>
          </div>
          <menu-fichier :idf="x.fa.id" class="col-auto self-start"
            simple :note="x.n"/>
        </div>

        <div class="text-italic q-my-sm">{{x.titre}}</div>

        <div v-if="x.fa.dhdc === 0" class="titre-md q-my-sm">{{$t('DFchgdl')}}</div>

        <div v-else class="titre-md q-my-sm">
          <div>
            <span>{{$t('DFchgdem', [dhcool(x.fa.dhdc, true)])}}</span>
            <span v-if="x.fa.nbr" class="q-ml-sm">- {{$t('DFretry', [x.fa.nbr])}}</span>
            <span v-if="!x.fa.exc">
              <span v-if="x.fa.id === faSt.idfdl" class="q-ml-sm">- {{$t('DFchgec')}}</span>
              <span v-else class="q-ml-sm">- {{$t('DFchgatt')}}</span>
            </span>
          </div>
          <div v-if="x.fa.exc">
            <div class="msg q-ml-sm">
              {{$t('DFerr', [x.fa.exc[0] === 404 ? $t('ER404') : '' + x.fa.exc[0]])}}
            </div>
            <div class="q-my-xs q-ml-sm font-mono fs-sm">
              {{$t('DFerr2', [x.fa.exc[0] === 404 ? x.fa.exc[1] : $t('EX' + x.fa.exc[0])])}}
            </div>
            <div class="row justify-between q-gutter-xs">
              <div class="col text-italic text-bold">
                {{$t(x.fa.nbr < 4 ? 'DFretaut' : 'DFnoret')}}
              </div>
              <btn-cond v-if="session.synchro" class="col-auto self-start" 
                :label="$t('retry')" icon="redo" @ok="retry(x.fa.id)"
                :color="x.fa.nbr < 4 ? 'primary' : 'warning'" />
            </div>
          </div>
        </div>
      </div>
    </q-expansion-item>
  </div>
</q-page>
</template>

<script setup>
import { computed } from 'vue'

import stores from '../stores/stores.mjs'
import { edvol, dhcool, dkli } from '../app/util.mjs'
import MenuFichier from '../components/MenuFichier.vue'
import BtnCond from '../components/BtnCond.vue'

const icx = ['circle', 'hourglass_empty', 'error']
const clrx = ['positive', 'warning', 'negative']

const faSt = stores.ficav
const nSt = stores.note
const session = stores.session

const lst = computed(() => {
  const l = []
  for (const [idf, fa] of faSt.map) {
    const n = nSt.getNote(fa.noteIds)
    if (!n) continue
    const titre = n ? n.titre : '?'
    const f = n.mfa.get(fa.id)
    l.push({fa, n, f, titre})
  }
  l.sort((a, b) => { return a.dhdc < b.dhdc ? -1 : (a.dhdc > b.dhdc ? 1 : 
    (a.fa.lg > b.fa.lg ? -1 : (a.fa.lg < b.fa.lg ? 1 : 0)))
  })
  return l
})

async function retry (idf) {
  await faSt.retry(idf)
}

const stx = (x) => x.fa.dhdc === 0 ? 0 : (x.fa.exc ? 2 : 1)

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
@import '../css/input.sass'
.q-card > div
  box-shadow: inherit !important
</style>
