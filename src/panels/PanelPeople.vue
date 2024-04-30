<template>
<q-dialog v-model="ui.d.detailspeople" full-height position="left" persistent>
<q-layout container view="hHh lpR fFf" :class="styp('md')">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
      <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('APtit', [session.getCV(id).nom])}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <q-card class="q-pa-sm">
      <apercu-genx :id="id" />

      <barre-people v-if="session.estComptable || session.estDelegue" :id="id"/>

      <q-separator color="orange" class="q-my-md q-mx-sm"/>

      <div class="titre-md text-italic y-mb-sm">{{$t('PPchats')}}</div>

      <chats-avec :id-e="id" :del="del"/>

      <q-separator color="orange" class="q-my-md q-mx-sm"/>

      <div class="titre-md text-italic y-mb-sm">{{$t('PPgroupes')}}</div>

      <div v-for="idg in pSt.peC.sgr" :key="idg">
        <div class="q-my-sm row q-gutter-sm">
          <span class="fs-md col">{{session.getCV(idg).nomc}} - {{$t('AMm' + stmb(idg))}}</span>
          <btn-cond class="col-auto" size="sm" icon-right="open_in_new"
            :label="$t('PGvg')" @ok="voirgr(idg)"/>
        </div>
      </div>

    </q-card>
  
  </q-page-container>

</q-layout>
</q-dialog>
</template>
<script>

// import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuGenx from '../components/ApercuGenx.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import BarrePeople from '../components/BarrePeople.vue'
import ChatsAvec from '../components/ChatsAvec.vue'
import BtnCond from '../components/BtnCond.vue'
import { styp } from '../app/util.mjs'

export default {
  name: 'PanelPeople',

  components: { BtnCond, ApercuGenx, BoutonHelp, BarrePeople, ChatsAvec },

  props: { },

  computed: {
    id () { return this.session.peopleId },
    del () { const p = this.session.partition
      return p && p.estDel(this.id)
    }
  },

  watch: {
  },
  
  data () {
    return {
    }
  },

  methods: {
    gr (idg) { const e = this.gSt.egr(idg); return e ? e.groupe : null },

    im (idg) { const g = this.gr(idg); return g ? g.tid[this.id] : 0 },

    stmb (idg) { const im = this.im(idg); return im ? g.statutMajeur(im) : 0 },

    voirgr (idg) {
      this.session.setGroupeId(idg)
      this.session.setMembreId(this.im(idg))
      this.ui.setPage('groupe', 'membres')
    }
  },

  setup () {
    return {
      styp, 
      session: stores.session,
      pSt: stores.people,
      gSt: stores.groupe, 
      ui: stores.ui
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.q-card__section
  padding: 2px !important
</style>
