<template>
  <q-page class="column q-pl-xs q-mr-sm spmd" style="padding-top:5em">
    <div v-if="pSt.map.size && !lst.length" class="q-my-md titre-lg text-italic">
      {{$t('APnb', [pSt.map.size])}}
    </div>
    
    <div v-if="lst.length">
      <q-card class="q-my-md column justify-center" v-for="(p, idx) in lst" :key="p.id">
        <apercu-genx class="q-pa-xs" :id="p.id" :idx="idx" nodet/>
        <div :class="dkli(idx) + ' text-center'">
          <span v-if="p.d[0] > 3" class="msg">
            <span>{{$t('PPctc' + p.d[0])}}</span>
            <span v-if="p.d[1]" class="q-ml-xs">({{$t('AMm' + p.d[1])}}}</span>
          </span>
          <btn-cond v-else cond="cEdit" icon="check" color="green-5" :label="$t('PPctcok')"
            @ok="select(p)"/>
        </div>
      </q-card>
    </div>

      <!-- Confirmation du contact ------------------------------------------------>
    <q-dialog v-model="ui.d.PInvit" persistent>
      <q-card :class="styp('sm')">
        <q-toolbar class="bg-secondary text-white">
          <btn-cond color="warning" icon="close" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center">{{$t('PItit', [nomg])}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
        <div class="q-pa-xs">
          <div class="titre-md q-mb-xs text-center">{{$t('PItx1')}}</div>
          <apercu-genx class="q-pa-xs" :id="session.peopleId" :idx="0" nodet/>
          <q-card-actions align="right" class="q-gutter-sm">
            <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD" />
            <btn-cond color="warning" icon="add" cond="cEdit"
            :label="$t('ajouter')" @ok="okAjouter" />
          </q-card-actions>
        </div>
      </q-card>
    </q-dialog>

    <q-page-sticky v-if="session.accesNet && !session.estA" position="top" 
      :offset="[0, 0]">
      <div class="row bg-secondary text-white justify-between" style="width:100vw">
        <btn-cond :label="$t('renoncer')" @ok="ui.setPage('groupe', 'groupe')"/>
        <q-checkbox v-model="propos" :label="$t('PIfi')" />
        <btn-cond :label="$t('CVraf')" @ok="rafCvs"/>
      </div>
    </q-page-sticky>
  </q-page>
</template>

<script>

import stores from '../stores/stores.mjs'
import ApercuGenx from '../components/ApercuGenx.vue'
import BtnCond from '../components/BtnCond.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import { RafraichirCvsAv } from '../app/operations4.mjs'
import { NouveauContact } from '../app/operations4.mjs'
import { dkli, styp } from '../app/util.mjs'

export default {
  name: 'PageInvitation',

  components: { ApercuGenx, BtnCond, BoutonHelp },

  computed: {
    nomg () { return this.session.getCV(this.session.groupeId).nom },
    lst () { const src = this.pSt.peLpF; const l = []
      this.session.compte.lstAvatars.forEach(x => {
        const y = { id: x.id }
        y.d = this.gSt.diagContact(x.id)
        if (!y.d[0] || this.propos) l.push(y)
      })
      src.forEach(x => {
        const y = { id: x.id }
        y.d = this.gSt.diagContact(x.id)
        if (!y.d[0] || this.propos) l.push(y)
      })
      return l
    }
  },

  methods: {
    async rafCvs () {
      let nc = 0, nv = 0
      for (const id of this.session.compte.mav) {
        const [x, y] = await new RafraichirCvsAv().run(id)
        nc += x; nv += y
      }
      stores.ui.afficherMessage(this.$t('CVraf2', [nc, nv]), false)
    }, 
    select (p) {
      this.session.setPeopleId(p.id)
      this.ui.oD('PInvit')
    },
    async okAjouter () {
      await new NouveauContact().run()
      this.ui.setPage('groupe', 'groupe')
    }
  },

  data () {
    return {
      propos: true // n'afficher que ceux proposables
    }
  },

  setup () {
    return {
      dkli, styp,
      session: stores.session,
      ui: stores.ui,
      pSt: stores.people,
      gSt: stores.groupe
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
