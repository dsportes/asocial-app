<template>
  <div :class="'col items-start ' + dkli(idx)">
    <div>
      <span class="text-bold fs-md q-mr-sm">{{t.na.nom}}</span> 
      <span class="text-bold fs-sm font-mono q-mr-sm">#{{id}}</span> 
    </div>

    <div v-if="t.info" class="q-ml-md q-my-xs bord row">
      <show-html class="col" :idx="idx" zoom maxh="3rem" :texte="t.info"/>
      <q-btn v-if="edit && session.estComptable" color="primary" 
        class="col-auto q-ml-sm btn2" size="sm" dense icon="edit" @click="editer"/>
    </div>
    <div v-else class="q-ml-md q-my-xs">
      <span class="titre-sm">{{$t('PTnoinfo')}}</span>
      <q-btn v-if="edit && session.estComptable" class="q-ml-sm" size="sm" dense
        :label="$t('PTecr')" color="primary" icon="edit" @click="editer"/>
    </div>

    <apercu-notif class="q-ml-md q-my-xs" :src="t" :edit="edit && session.estComptable" :idx="idx"/>
    <apercu-notif class="q-ml-md q-my-xs" :src="t" sponsor :edit="edit && !session.estComptable" :idx="idx"/>

    <div class="q-ml-md q-mb-xs row largeur30">
      <div class="col-5 titre-sm">{{$t('NTvx')}}</div>
      <div class="col-3 fs-sm text-bold font-mono">{{$t('NTvx1', [q1, pc1])}}</div>
      <div class="col-3 fs-sm text-bold font-mono">{{$t('NTvx2', [q2, pc2])}}</div>
      <div class="col-1">
        <q-btn v-if="session.estComptable" size="sm" icon="edit" dense color="primary" @click="editerq"/>
      </div>
    </div>

    <div class="q-ml-md q-mt-sm row largeur30 justify-start">
      <div class="col-6 titre-sm">{{$t('PTntfc')}}</div>
      <div class="col-6">
        <span class="q-ml-md font-mono q-mr-xs">{{t.cpt.nco[0]}}</span>
        <notif-ico/>
        <span class="q-ml-md font-mono q-mr-xs">{{t.cpt.nco[1]}}</span>
        <notif-ico gravite/>
      </div>
    </div>
    <div class="q-ml-md q-mt-xs row largeur30 justify-start">
      <div class="col-6 titre-sm">{{$t('PTntfs')}}</div>
      <div class="col-6">
        <span class="q-ml-md font-mono q-mr-xs">{{t.cpt.nsp[0]}}</span>
        <notif-ico/>
        <span class="q-ml-md font-mono q-mr-xs">{{t.cpt.nsp[1]}}</span>
        <notif-ico gravite/>
      </div>
    </div>

    <apercu-blocage :blocage="t.blocage" :edit="edit" :idx="idx" :na-tr="t.na"/>

    <!-- Edition du commentaire attachée à une tribu -->
    <q-dialog v-model="edcom" persistent>
      <q-card class="petitelargeur">
        <q-toolbar>
          <q-btn dense size="md" color="warning" icon="close" @click="close"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('NTcom', [t.na.nom])}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
        <editeur-md style="height:50vh" :lgmax="250" editable :texte="t.info"
          :label-ok="$t('valider')" modetxt @ok="valider"/>
      </q-card>
    </q-dialog>

    <!-- Dialogue de mise à jour des quotas de la tribu -->
    <q-dialog v-model="edq" persistent>
      <q-card class="petitelargeur">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense size="md" color="warning" icon="close" @click="edq = false"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTqut')}}</q-toolbar-title>
        </q-toolbar>
        <choix-quotas class="q-mt-sm" :quotas="quotas" />
        <q-card-actions>
          <q-btn :disabled="quotas.err" dense size="md" color="primary" 
            icon="check" :label="$t('ok')" @click="validerq"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

  </div>
</template>
<script>

import { toRef, ref, watch } from 'vue'

import stores from '../stores/stores.mjs'
import ShowHtml from './ShowHtml.vue'
import ApercuNotif from './ApercuNotif.vue'
import ApercuBlocage from '../components/ApercuBlocage.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import { edvol } from '../app/util.mjs'
import { UNITEV1, UNITEV2 } from '../app/api.mjs'
import { SetAttributTribu } from '../app/operations.mjs'
import { crypter } from '../app/webcrypto.mjs'
import BoutonHelp from './BoutonHelp.vue'
import EditeurMd from './EditeurMd.vue'
import NotifIco from './NotifIco.vue'

export default {
  name: 'ApercuTribu',

  props: { 
    id: Number, // id de la tribu
    idx: Number, edit: Boolean
  },

  components: { ShowHtml, ApercuNotif, EditeurMd, BoutonHelp, NotifIco, ApercuBlocage, ChoixQuotas },

  computed: { 
    q1 () { return this.ed1(this.t.cpt.q1 || 0)},
    q2 () { return this.ed2(this.t.cpt.q2 || 0)},
    pc1 () {
      const x = this.t.cpt
      return !x.a1 || !x.q1 ? 0 : (Math.round((x.a1 * 100) / (x.q1 * UNITEV1)))
    },
    pc2 () {
      const x = this.t.cpt
      return !x.a2 || !x.q2 ? 0 : (Math.round((x.a2 * 100) / (x.q2 * UNITEV2)))
    }
  },

  data () { return {
    edcom: false,
    info: '',
    bloc: null,
    quotas: {},
    edq: false
  }},

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    ed1 (v) { return edvol(v * UNITEV1) },
    ed2 (v) { return edvol(v * UNITEV2) },
    editer () {
      this.info = this.t.info || ''
      this.edcom = true
    },
    async valider (txt) {
      const buf = txt ? await crypter(this.session.clek, txt) : null
      await new SetAttributTribu().run(this.id, 'infok', buf)
      this.close()
    },
    close () { this.edcom = false},
    editerq () {
      this.quotas = { q1: this.t.cpt.q1, q2: this.t.cpt.q2, min1: 0, min2: 0, 
        max1: 9999,
        max2: 9999
      }
      this.edq = true
    },
    validerq () {
      console.log(JSON.stringify(this.quotas))
    }
  },

  setup (props) {
    const avStore = stores.avatar
    const session = stores.session
    const id = toRef(props, 'id')

    function getT () {
      const t = id.value === session.tribuId ? session.tribu : avStore.getTribu(id.value)
      return t
    }

    const t = ref(getT())
    avStore.$onAction(({ name, args, after }) => {
      after((result) => {
        if ((name === 'setTribuC' || name === 'setTribu') && args[0].id === id.value) {
          t.value = getT()
        }
      })
    })

    /* Nécessaire pour tracker le changement d'id
    Dans une liste le composant N'EST PAS rechargé quand la liste change */
    watch(() => id.value, (ap, av) => {
        t.value = getT()
      }
    )


    return {
      session,
      t
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.btn2
  max-height: 1.3rem
</style>
