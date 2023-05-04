<template>
<q-layout v-if="session.ok" container view="hHh lpR fFf" :class="sty" style="width:80vw">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
      <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('APtit', [pSt.peC.na.nom])}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <q-card class="q-pa-sm">
      <apercu-people :id="session.peopleId" simple />
      <div class="row">
        <div v-if="aSt.mbPeC">
          <div v-if="aSt.mbPeC.sp" class="titre-md text-bold text-warning">
            {{$t('PPsp', [aSt.tribuC.na.nom])}}</div>
          <div v-else class="titre-md">{{$t('PPco', [aSt.tribuC.na.nom])}}</div>
        </div>
      </div>

      <barre-people v-if="session.estComptable || session.estSponsor" :na="pSt.peC.na"/>

      <q-separator color="orange" class="q-my-md q-mx-sm"/>

      <div class="titre-md text-italic y-mb-sm">{{$t('PPchats')}}</div>

      <div v-for="(na, idx) in aSt.compta.lstAvatarNas" :key="na.id">
        <apercu-chat class="q-my-md" affnai
          :na-i="na" :na-e="pSt.peC.na" :ids="ids[na.id]" :idx="idx" :mapmc="mapmc"/>
      </div>

      <q-separator color="orange" class="q-my-md q-mx-sm"/>

      <div v-if="ui.egrplus && !pSt.peC.groupes.has(ui.egrplus.groupe.na.id)">
        <div class="row items-center justify-between">
          <div class="col titre-md bg-yellow-3 text-warning text-bold text-center">
            {{$t('PGplus5b', [ui.egrplus.groupe.na.nom, ui.naplus.nom, pSt.peC.na.nom])}}</div>
          <q-btn class="col-auto text-center q-ml-xs" dense size="md" no-caps color="primary" icon="check"
            :label="$t('ok')" @click="contact"/>
        </div>
        <q-separator color="orange" class="q-my-md q-mx-sm"/>
      </div>

      <div class="titre-md text-italic y-mb-sm">{{$t('PPgroupes')}}</div>

      <div v-for="[id, ids] in pSt.peC.groupes" :key="ids + '/' + id">
        <div class="q-my-sm row q-gutter-sm">
          <span class="fs-md col">{{egr(id).groupe.na.nomc}} - {{$t('statutmb' + stmb(id, ids))}}</span>
          <q-btn class="col-auto btn1" dense size="sm" icon-right="open_in_new" color="primary"
            :label="$t('detail')" @click="detailgr(id, ids)"/>
          <q-btn class="col-auto btn1" dense size="sm" icon-right="open_in_new" color="primary"
            :label="$t('PGvg')" @click="voirgr(id, ids)"/>
        </div>
      </div>

    </q-card>
  </q-page-container>

  <!-- Dialogue de détail d'un membre d'un groupe -->
  <q-dialog v-model="infoedit" persistent full-height style="width:80vw">
    <q-card>
      <q-toolbar class="bg-secondary text-white">
        <q-btn dense size="md" icon="close" color="warning" @click="infoedit=false"/>
        <q-toolbar-title class="titre-lg full-width">{{$t('PPtit', [mbC.na.nom, egrC.groupe.na.nom])}}</q-toolbar-title>
      </q-toolbar>
      <apercu-membre :eg="egrC" :mb="mbC" :mapmc="mapmc" :idx="0" people nopanel/>
    </q-card>
  </q-dialog>

</q-layout>
</template>
<script>

import { ref, onMounted, reactive } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuPeople from '../components/ApercuPeople.vue'
import ApercuChat from '../components/ApercuChat.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import BarrePeople from '../components/BarrePeople.vue'
import ApercuMembre from '../components/ApercuMembre.vue'
import { MD, Chat, Motscles } from '../app/modele.mjs'
import { NouveauMembre } from '../app/operations.mjs'

export default {
  name: 'PanelPeople',
  components: { ApercuMembre, ApercuPeople, BoutonHelp, ApercuChat, BarrePeople },

  props: { },

  computed: {
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
  },

  watch: {
  },
  
  data () {
    return {
      MD,
      egrC: null,
      mbC: null,
      infoedit: false
    }
  },

  methods: {
    egr (id) { return this.gSt.egr(id) },
    stmb (id, ids) { return this.egr(id).groupe.ast[ids]},
    detailgr (id, ids) {
      this.egrC = this.gSt.egr(id)
      this.mbC = this.gSt.getMembre(id, ids)
      this.infoedit = true
    },
    voirgr (id, ids) {
      this.egrC = this.gSt.egr(id)
      this.mbC = this.gSt.getMembre(id, ids)
      MD.fD()
      this.ui.setPage('groupe', 'membres')
    },
    async contact () {
      const gr = this.ui.egrplus.groupe
      const pe = this.pSt.peC
      const na = pe.na
      const m = this.gSt.membreDeId(this.ui.egrplus, this.ui.naplus.id)
      await new NouveauMembre().run(na, gr, m.ids, pe.cv)
    }
  },

  setup (props) {
    const session = stores.session
    const pSt = stores.people
    const aSt = stores.avatar
    const gSt = stores.groupe
    const ui = stores.ui

    const mapmc = ref(Motscles.mapMC(true, 0))

    const ids = reactive({})
    onMounted(async () => {
      for(const na of aSt.compta.lstAvatarNas) {
        ids[na.id] = await Chat.getIds(na, pSt.peC.na)
      }
    })

    return {
      session,
      aSt,
      pSt,
      gSt,
      ui,
      mapmc,
      ids
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord1
  border: 1px solid $grey-5
.bord2
  background: $yellow-3
  color: black
  font-weight: bold
.q-card__section
  padding: 2px !important
.q-btn
  padding: 0 3px !important
.btn1
  height: 1.5rem
</style>
