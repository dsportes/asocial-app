<template>
  <q-page>
    <q-expansion-item class="q-mb-md" header-class="bg-primary text-white" 
      switch-toggle-side expand-separator dense>
      <template v-slot:header>
        <div class="row full-width fs-md">
          <span>{{$t('TUtr')}} #{{ID.court(p.id)}}</span>
          <span v-if="session.pow === 2" class= "q-ml-sm">{{session.compte.codeP(p.id)}}</span>
        </div>
      </template>
      <div class="q-ml-xl q-mb-lg splg">
        <div class="row justify-around">
          <tuile-cnv type="qc" :src="lg" occupation/>
          <tuile-cnv type="qn" :src="lg" occupation/>
          <tuile-cnv type="qv" :src="lg" occupation/>
          <tuile-notif :src="lg" occupation/>
        </div>
        <div class="q-my-xs">
          <apercu-notif editable :notif="lg.notif" :type="1" :ctx="{ idt: p.id }"/>
        </div>
      </div>
    </q-expansion-item>

    <q-toolbar class="bg-secondary text-white">
      <q-toolbar-title class="titre-md q-ma-xs">{{$t('PTtit' + (session.pow === 4 ? '1' : '2'))}}</q-toolbar-title>          
      <q-btn v-if="session.estDelegue || session.estComptable"
        size="md" dense color="primary" 
        :label="$t('PTnvc')" @click="ui.oD('NSnvsp')"/>
    </q-toolbar>

    <div v-for="(c, idx) in session.ptLcFT" :key="c.id" class="spmd">
      <q-expansion-item dense switch-toggle-side group="g1" :class="dkli(idx)">
        <template v-slot:header>
          <div class="row full-width items-center justify-between">
            <div class="row items-center">
              <img class="photomax" :src="pSt.getCV(c.id).photo" />

              <div class="titre-md q-ml-sm">{{nomc(c)}}
                <span v-if="type(c)===1" class="q-ml-sm">[{{$t('moi')}}]</span>
                <span v-if="c.del" class="q-ml-sm">[{{$t('sponsor2')}}]</span>
              </div>

              <q-icon size="md" v-if="c.notif" :name="ico(c)"
                :class="'q-ml-md ' + tclr(c) + ' ' + bgclr(c)"/>

            </div>
            <!--
            <q-btn v-if="type(c)===2" class="q-ml-md" icon="open_in_new" size="md" color="primary" dense
              @click.stop="voirpage(c)"/>
              -->
          </div>
        </template>

        <div class="q-ml-lg">
          <apercu-genx v-if="type(c)===2 || type(c)===1" :id="c.id" :idx="idx"/>
          <div v-else class="titre-md">#{{c.id}}</div>
          <barre-people v-if="session.estComptable || session.estDelegue" :id="c.id"/>

          <apercu-notif class="q-my-xs" editable
            :notif="c.notif" :type="2" :idx="idx" :ctx="{ idt: p.id, idc: c.id }"/>

          <div v-if="c.del && !ID.estComptable(c.id)" class="titre-md text-bold text-warning">{{$t('PTsp')}}</div>

          <div v-if="vis(c)" class="q-my-sm row">
            <quotas-vols class="col" :vols="c.q" />
            <q-btn v-if="session.pow < 4" size="md" class="col-auto q-ml-sm self-start"
                icon="settings"
                dense padding="none" round color="primary" @click="editerq(c)"/>
          </div>
          
        </div>
      </q-expansion-item>
    </div>

    <!-- Dialogue de création d'un nouveau sponsoring -->
    <nouveau-sponsoring v-if="ui.d.NSnvsp" :partition="session.partitionC || session.partition"/>
    
    <!-- Dialogue de mise à jour des quotas du compte -->
    <q-dialog v-model="ui.d.PTedq" persistent>
      <q-card :class="styp('sm')">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense size="md" color="warning" padding="xs" icon="close" @click="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTqu')}}</q-toolbar-title>
        </q-toolbar>
        <choix-quotas class="q-mt-sm" :quotas="quotas" />
        <q-card-actions align="right" class="q-gutter-sm">
          <q-btn flat dense size="md" color="primary" padding="xs" icon="undo" 
            :label="$t('renoncer')" @click="ui.fD"/>
          <q-btn dense size="md" color="primary" padding="xs" icon="check" 
            :disable="quotas.err" :label="$t('ok')" @click="validerq"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Affichage des compteurs de compta du compte "courant"-->
    <q-dialog v-model="ui.d.PTcptdial" full-height position="left" persistent>
      <q-layout container view="hHh lpR fFf" :class="styp('md')">
        <q-header elevated>
          <q-toolbar class="bg-secondary text-white">
            <q-btn dense size="md" color="warning" icon="chevron_left" @click="ui.fD"/>
            <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTcompta', [ccnomc])}}</q-toolbar-title>
          </q-toolbar>
        </q-header>
        <q-page-container>
          <panel-compta style="margin:0 auto"/>
        </q-page-container>
      </q-layout>
    </q-dialog>

  </q-page>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import { dkli } from '../app/util.mjs'
import { ID } from '../app/api.mjs'
import TuileCnv from '../components/TuileCnv.vue'
import TuileNotif from '../components/TuileNotif.vue'
import ApercuNotif from '../components/ApercuNotif.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import PanelCompta from '../components/PanelCompta.vue'
import QuotasVols from '../components/QuotasVols.vue'
import NouveauSponsoring from '../panels/NouveauSponsoring.vue'
import BarrePeople from '../components/BarrePeople.vue'
import { SetQuotas, SetNotifT, SetNotifC } from '../app/operations.mjs'
import { styp } from '../app/util.mjs'

const ic = ['check', 'report', 'alarm_on', 'lock_open', 'lock', 'close']
const txt = ['green-3', 'green-3', 'orange-9', 'negative', 'negative', 'negative']
const bg = ['none', 'none', 'yellow-1', 'yellow-2', 'yellow-5',  'yellow-7']

export default {
  name: 'PagePartition',
  components: { TuileCnv,TuileNotif, ApercuNotif, ChoixQuotas, ApercuGenx,
    PanelCompta, QuotasVols, NouveauSponsoring, BarrePeople },

  props: { },

  computed: {
    lg () { return this.p.synth },
    p () { return this.session.partitionC || this.session.partition }
  },

  methods: {
    ico (c) { return ic[c.notif.niv || 0] },
    tclr (c) { return 'text-' + txt[c.notif.niv || 0]},
    bgclr (c) { return 'bg-' + bg[c.notif.niv || 0] },

    vis (c) { 
      return (this.session.pow < 4 || (c.id === this.aSt.compteId))
    },

    type (c) {
      if (this.aSt.estAvatar(c.id)) return 1
      if (this.pSt.estPeople(c.id)) return 2
      return 3
    },

    nomc (c) {
      const cv = this.session.getCV(c.id)
      return this.type(c) === 1 ? cv.nom : (this.type(c) === 2 ? cv.nomc : '#' + c.id)
    },

    async voirpage (c) { 
      this.session.setPeopleId(c.id)
      this.ui.oD('detailspeople')
    },

    async editerq (c) {
      if (! await this.session.edit()) return
      this.quotas = { q1: c.q1, q2: c.q2, qc: c.qc, min1: 0, min2: 0, minc: 0,
        max1: this.aSt.tribuC.synth.q1 - this.aSt.tribuC.synth.a1 + c.q1,
        max2: this.aSt.tribuC.synth.q2 - this.aSt.tribuC.synth.a2 + c.q2,
        maxc: this.aSt.tribuC.synth.qc - this.aSt.tribuC.synth.ac + c.qc,
        c: c
        }
      this.ui.oD('PTedq')
    },
    
    async validerq () {
      await new SetQuotas().run(this.aSt.tribuC.id, 
        this.quotas.c.id, [this.quotas.qc, this.quotas.q1, this.quotas.q2])
      this.ui.fD()
    },

    async chgNtf (ntf) {
      const idc = ntf.ctx.id
      delete ntf.ctx
      await new SetNotifC().run (this.aSt.tribuC.id, idc, ntf)
    },
    async chgNtfT (ntf) {
      await new SetNotifT().run(this.aSt.tribuC.id, ntf)
    }
},

  data () {
    return {
      ccid: 0, // compte "courant" dans la liste
      ccnomc: '', // nom plus ou moins complet du compte "courant"
      quotas: {},
      cpt: null,
      fipeople: false
    }
  },

  setup () {
     return {
      session: stores.session, 
      aSt: stores.avatar, 
      pSt: stores.people, 
      ui: stores.ui,
      cfg: stores.config,
      ID, dkli, styp
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
