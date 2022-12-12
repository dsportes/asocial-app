<template>
<div ref="root">
  <q-page class="column">
    <div class="filler"/>

    <div class="q-pb-md titre-lg text-center">{{$t('P12tit')}}</div>

    <div v-if="!lst || !lst.length" class="titre-lg">{{$t('P12not')}}</div>

    <div v-if="lst && lst.length">
      <div v-for="(t, idx) in lst" :key="t.id" class="q-py-md">
        <div :ref-elt="'#' + idx" :class="dkli(idx) + ' row items-start zone' + (idx === tribus.idx ? ' courant' : '')">
          <q-btn class="col-auto q-mr-sm play" flat dense color="primary"
            icon="play_arrow" @click="afficher(idx)"/>
          <div class="col">
            <div class="row justify-start items-center">
              <info-ico size="sm" :color="colors[t.ist]" :icon="icons[t.ist]" :info="$t(infos[t.ist])"/>
              <div class="fs-md text-bold">{{t.na.nom}}</div>
              <div class="q-pt-xs q-ml-md fs-sm font-mono">{{t.id}}</div>
            </div>
            <show-html class="q-mr-sm border" style="height:2.5rem;overflow:hidden" :texte="t.info" :idx="idx"/>
            <div class="q-mr-sm">
              <div>{{$t('comptes', t.nbc, { count: t.nbc })}} - {{$t('parrains', nbp(t), { count: nbp(t) })}}</div>
              <span>{{$t('P12att', [ed1(t.f1), ed2(t.f2)])}} - </span>
              <span>{{$t('P12att', [ed1(t.r1), ed2(t.r2)])}}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <q-dialog v-model="detailTribu" full-height persistent>
      <panel-tribu :close="fermerDetail"/>
    </q-dialog>

    <q-page-sticky position="top-left" class="full-width bg-secondary text-white" expand>
      <q-expansion-item class="full-width" v-model="filtreOuvert"
        dense dense-toggle expand-separator icon="filter_alt">
        <template v-slot:header>
          <div class="row justify-between full-width">
            <div class="q-ml-sm titre-lg">{{$t('P12fil')}}</div>
            <q-btn dense size="sm" icon="add" :label="$t('P12ntr')" color="primary" @click.stop="ouvrirNvTr"/>
          </div>
        </template>

        <div class="row justify-between full-width">
          <div class="col-auto row items-end">
            <q-radio v-model="opt" val="c" :label="$t('contient')" />
            <q-radio v-model="opt" val="d" :label="$t('debute')" />
            <q-input v-model="txt" class="q-ml-lg" style="width:3rem" dense placeholder="abc"/>
          </div>
          <q-checkbox class="q-ml-sm" left-label v-model="bloquee" :label="$t('P12trb')" />
        </div>

    </q-expansion-item>
  </q-page-sticky>

  </q-page>
</div>
</template>

<script>
import { ref, watch, computed } from 'vue'
import stores from '../stores/stores.mjs'
import { UNITEV1, UNITEV2 } from '../app/api.mjs'
import { edvol } from '../app/util.mjs'
import ShowHtml from '../components/ShowHtml.vue'
import PanelTribu from '../dialogues/PanelTribu.vue'
import InfoIco from '../components/InfoIco.vue'

import { scroll } from 'quasar'
const { getScrollTarget, setVerticalScrollPosition } = scroll

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'Page12',

  components: { InfoIco, ShowHtml, PanelTribu },

  computed: {
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
  },

  watch: {
    opt (ap) { this.tribus.setFiltre(this.opt.value, this.txt, this.bloquuee) },
    txt (ap) { this.tribus.setFiltre(this.opt.value, this.txt, this.bloquuee) },
    bloqquee (ap) { this.tribus.setFiltre(this.opt.value, this.txt, this.bloquuee) },
  },

  data() {
    return {
      icons: ['thumb_up', 'report', 'report_problen', 'lock', 'highlight_off'],
      colors: ['green', 'warning', 'negative', 'negative', 'primary'],
      infos: ['OK', 'enalerte', 'ensursis', 'bloque', 'aucuncompte'],
      opt: 'c',
      txt: '',
      bloquee: false,
      nouvtr: false,
      filtreOuvert: false,
      detailTribu: false
    }
  },

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    ed1 (f) { return edvol(f * UNITEV1) },
    ed2 (f) { return edvol(f * UNITEV2) },
    nbp (t) {
      return t.naParrains.length
    },
    ouvrirNvTr () {
      this.filtreOuvert = false
      this.nouvtr = true
      console.log('nouvtr')
    },
    afficher (idx) {
      this.tribus.setIdx(idx)
      this.detailTribu = true
    },
    fermerDetail () {
      this.detailTribu = false
      const x = '[ref-elt="#' + this.tribus.idx + '"]'
      const el = this.root.querySelector(x)
      const target = getScrollTarget(el)
      const offset = el.offsetTop - 30
      const duration = 500
      setVerticalScrollPosition(target, offset, duration)
    }
   },

  setup () {
    const root = ref(null)
    const session = stores.session
    const tribus = stores.listeTribus

    let cbDem = false // true si le calculBase a été demandé
    watch(tribus, (ap, av) => {
      if (cbDem || !ap.modifs) return // pas modifié OU une demande de calcul est en cours
      cbDem = true; setTimeout(() => { ap.calculBase(); cbDem = false }, 10)
    })

    tribus.calculBase()
    return {
      root,
      session,
      tribus,
      lst: computed(() => { return tribus.liste }),
    }
  }
}
</script>
<style lang="sass">
.q-item__section--side
  padding-right:  8px !important
.q-item
  padding: 0 !important
</style>

<style lang="sass" scoped>
@import '../css/app.sass'
$haut: 2.5rem
.filler
  height: $haut
  width: 100%
.border
  border: 1px solid $grey-5
  border-radius: 3px
.courant
  border-left: 4px solid $warning !important
</style>
