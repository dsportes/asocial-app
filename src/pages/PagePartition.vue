<template>
<q-page>
  <div v-if="p" class="column">
    <q-expansion-item v-if="session.estDelegue || session.estComptable"
      class="q-mt-xs q-mb-md" header-class="bg-primary text-white" 
      switch-toggle-side expand-separator dense>
      <template v-slot:header>
        <div class="full-width fs-md">{{$t('TUpart', [session.codePart(p.id)])}}</div>
      </template>
      <div class="q-ml-xl q-mb-lg splg">
        <div class="row justify-around">
          <tuile-cnv type="qc" :src="lg" occupation/>
          <tuile-cnv type="qn" :src="lg" occupation/>
          <tuile-cnv type="qv" :src="lg" occupation/>
          <tuile-notif :src="lg" occupation/>
        </div>
        <div class="q-my-xs">
          <apercu-notif editable :notif="lg.notif" :type="1" :cible="p.id"/>
        </div>
      </div>
    </q-expansion-item>

    <div class="full-width fs-md bg-primary text-white q-my-xs">{{$t('TUpart', [session.codePart(p.id)])}}</div>

    <q-toolbar class="bg-secondary text-white">
      <q-toolbar-title class="titre-md q-ma-xs">{{$t('PTtit' + (session.pow === 4 ? '1' : '2'))}}</q-toolbar-title>          
      <btn-cond v-if="session.estDelegue || session.estComptable"
        cond="cEdit"
        :label="$t('PTnvc')" @click="ui.oD('NSnvsp')"/>
    </q-toolbar>

    <div v-for="(c, idx) in session.ptLcFT" :key="c.id" class="spmd q-my-xs">
      <q-expansion-item dense switch-toggle-side group="g1" :class="dkli(idx)">
        <template v-slot:header>
          <div class="row full-width items-center justify-between">
            <div class="row items-center">
              <img class="photomax" :src="c.cv.photo" />

              <div class="titre-md q-ml-sm">{{c.cv.nomC}}
                <span v-if="type(c)===1" class="q-ml-sm">[{{$t('moi')}}]</span>
                <span v-if="c.del" class="q-ml-sm">[{{$t('delegue')}}]</span>
              </div>

              <q-icon size="md" v-if="c.notif" :name="ico(c)"
                :class="'q-ml-md ' + tclr(c) + ' ' + bgclr(c)"/>

            </div>
            
            <q-btn v-if="type(c)===2" class="q-ml-md" icon="open_in_new" size="md" color="primary" dense
              @click.stop="voirpage(c)"/>
            
          </div>
        </template>

        <div class="q-ml-lg">
          <apercu-genx v-if="type(c)!==3 && (session.compteId !== c.id)" :id="c.id" :idx="idx" :del="c.del"/>

          <barre-people v-if="session.estComptable || session.estDelegue" :id="c.id"/>

          <chats-avec v-if="session.compteId !== c.id" class="q-mt-xs" 
            :idE="c.id" :del="(session.estComptable || session.estDelegue) || c.del"/>

          <apercu-notif v-if="session.estDelegue || session.estComptable" class="q-my-xs" editable
            :notif="c.notif" :type="2" :idx="idx" :cible="c.id"/>

          <div v-if="vis(c)" class="q-my-sm row">
            <quotas-vols class="col" :vols="c.q" />
            <btn-cond v-if="session.pow < 4" class="col-auto q-ml-sm self-start"
              cond="cEdit"
              icon="settings" round @ok="editerq(c)"/>
          </div>
          
        </div>
      </q-expansion-item>
    </div>

    <!-- Dialogue de création d'un nouveau sponsoring -->
    <nouveau-sponsoring v-if="ui.d.NSnvsp"/>
    
    <!-- Dialogue de mise à jour des quotas du compte -->
    <q-dialog v-model="ui.d.PTedq" persistent>
      <q-card :class="styp('sm')">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense size="md" color="warning" padding="xs" icon="close" @click="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTqu')}}</q-toolbar-title>
        </q-toolbar>
        <choix-quotas class="q-mt-sm" :quotas="quotas" />
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond icon="check" :disable="quotas.err" :label="$t('ok')" @ok="validerq"/>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
  <div v-else class="titre-lg text-italic full-width text-center">{{$t('TUnopart')}}</div>
</q-page>
</template>

<script>

// import { onMounted } from 'vue'
import stores from '../stores/stores.mjs'
import { dkli } from '../app/util.mjs'
import { ID } from '../app/api.mjs'
import BtnCond from '../components/BtnCond.vue'
import TuileCnv from '../components/TuileCnv.vue'
import TuileNotif from '../components/TuileNotif.vue'
import ApercuNotif from '../components/ApercuNotif.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import QuotasVols from '../components/QuotasVols.vue'
import NouveauSponsoring from '../panels/NouveauSponsoring.vue'
import BarrePeople from '../components/BarrePeople.vue'
import ChatsAvec from '../components/ChatsAvec.vue'
import { SetNotifT, SetNotifC } from '../app/operations.mjs'
import { SetQuotas } from '../app/operations4.mjs'
import { styp } from '../app/util.mjs'

const ic = ['check', 'report', 'alarm_on', 'lock']
const txt = ['green-3', 'green-5', 'warning', 'negative']
const bg = ['none', 'none', 'yellow-1', 'yellow-5']

export default {
  name: 'PagePartition',
  components: { ChatsAvec, BtnCond, TuileCnv,TuileNotif, ApercuNotif, ChoixQuotas, ApercuGenx,
    QuotasVols, NouveauSponsoring, BarrePeople },

  props: { },

  computed: {
    lg () { return this.p ? this.p.synth : {} },
    p () { return this.session.partition }
  },

  methods: {
    ico (c) { return ic[c.notif.nr || 0] },
    tclr (c) { return 'text-' + txt[c.notif.nr || 0]},
    bgclr (c) { return 'bg-' + bg[c.notif.nr || 0] },

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
      this.ccid = c.id
      const s = this.session.partition.synth
      this.quotas = { qn: c.q.qn, qv: c.q.qv, qc: c.q.qc, minn: 0, minv: 0, minc: 0,
        maxn: s.q.qn - s.qt.qn + c.q.qn,
        maxv: s.q.qv - s.qt.qv + c.q.qv,
        maxc: s.q.qc - s.qt.qc + c.q.qc,
        err: ''
        }
      this.ui.oD('PTedq')
    },
    
    async validerq () {
      await new SetQuotas().run(this.ccid, this.quotas.qc)
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
    const session = stores.session
    /*
    async function reload () {
      if (session.accesNet && !session.estA) await new GetPartition().run(session.compte.idp)
    }
    if (session.accesNet) onMounted(async () => { await reload() })
    */

     return {
      session, 
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
